import { create } from 'zustand'
import type { SimulationConfig, SimulationPreset, LiveTelemetry, TelemetryPoint } from '@/types'
import { generateWaveValue, applyPresetWaveform } from '@/utils/waveforms'
import { telemetryWs } from '@/services/websocket'
import { mockDb } from '@/services/api'
import type { Alert } from '@/types'

interface SimulationState {
  config: SimulationConfig
  tick: number
  log: string[]
  telemetryBuffers: Record<string, TelemetryPoint[]>
  intervalId: ReturnType<typeof setInterval> | null
  setConfig: (partial: Partial<SimulationConfig>) => void
  applyPreset: (preset: SimulationPreset) => void
  start: () => void
  stop: () => void
  getDeviceTelemetry: (deviceId: string) => TelemetryPoint[]
}

const defaultConfig: SimulationConfig = {
  waveform: 'sine',
  frequencyMs: 1000,
  min: 10,
  max: 40,
  preset: 'normal',
  running: false,
}

function checkRulesAndAlert(deviceId: string, value: number, deviceName: string) {
  const rules = mockDb.getRules().filter((r) => r.enabled && r.deviceId === deviceId)
  for (const rule of rules) {
    let triggered = false
    switch (rule.condition) {
      case 'gt': triggered = value > rule.threshold; break
      case 'lt': triggered = value < rule.threshold; break
      case 'gte': triggered = value >= rule.threshold; break
      case 'lte': triggered = value <= rule.threshold; break
      case 'eq': triggered = value === rule.threshold; break
    }
    if (triggered) {
      const alerts = mockDb.getAlerts()
      const exists = alerts.some((a) => a.deviceId === deviceId && !a.acknowledged && a.condition.includes(String(rule.threshold)))
      if (!exists) {
        const alert: Alert = {
          id: `alt-${Date.now()}`,
          deviceId,
          deviceName,
          severity: value > rule.threshold * 1.2 ? 'critical' : 'warning',
          condition: `${rule.metric} ${rule.condition} ${rule.threshold}`,
          value: isNaN(value) ? 'N/A' : `${value.toFixed(1)}`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
        }
        mockDb.setAlerts([alert, ...alerts])
        useAlertStore.getState().addAlert(alert)
      }
    }
  }
}

import { useAlertStore } from '@/store/alertStore'

export const useSimulationStore = create<SimulationState>((set, get) => ({
  config: { ...defaultConfig },
  tick: 0,
  log: [],
  telemetryBuffers: {},
  intervalId: null,

  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),

  applyPreset: (preset) => {
    const waveform = applyPresetWaveform(preset)
    const updates: Partial<SimulationConfig> = { preset, waveform }
    if (preset === 'network-degradation') updates.frequencyMs = 5000
    else if (preset === 'overload-spike') { updates.min = 10; updates.max = 100 }
    else if (preset === 'sensor-fault') { updates.waveform = 'flatline' }
    else { updates.frequencyMs = 1000; updates.min = 10; updates.max = 40 }
    set((s) => ({ config: { ...s.config, ...updates } }))
    const { intervalId } = get()
    if (intervalId) { get().stop(); get().start() }
  },

  start: () => {
    const { intervalId, config } = get()
    if (intervalId) return
    telemetryWs.connect()
    const id = setInterval(() => {
      const state = get()
      const tick = state.tick + 1
      const devices = mockDb.getDevices()
      const newBuffers = { ...state.telemetryBuffers }
      const logEntries: string[] = []

      devices.forEach((device) => {
        if (!device.isToggledOn || device.status === 'offline') return

        let value = generateWaveValue(config.waveform, tick, config.min, config.max, config.preset)

        if (config.preset === 'network-degradation' && Math.random() < 0.3) return
        if (config.preset === 'overload-spike' && Math.random() < 0.1) value = config.max * 2

        const point: TelemetryPoint = { timestamp: new Date().toISOString(), value }
        const buffer = [...(newBuffers[device.id] ?? []), point].slice(-60)
        newBuffers[device.id] = buffer

        const payload: LiveTelemetry = {
          deviceId: device.id,
          timestamp: point.timestamp,
          metric: device.type === 'humidity' ? 'humidity' : 'temperature',
          value,
          signalStrength: device.signalStrength,
        }
        telemetryWs.emit(payload)
        logEntries.push(JSON.stringify(payload))

        if (!isNaN(value)) checkRulesAndAlert(device.id, value, device.name)
      })

      set((s) => ({
        tick,
        telemetryBuffers: newBuffers,
        log: [...logEntries, ...s.log].slice(0, 100),
        config: { ...s.config, running: true },
      }))
    }, config.frequencyMs)
    set({ intervalId: id, config: { ...config, running: true } })
  },

  stop: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set((s) => ({ intervalId: null, config: { ...s.config, running: false } }))
  },

  getDeviceTelemetry: (deviceId) => get().telemetryBuffers[deviceId] ?? [],
}))
