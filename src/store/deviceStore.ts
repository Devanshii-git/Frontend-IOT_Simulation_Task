import { create } from 'zustand'
import { DEVICE_SIMULATOR_BASE_URL, TELEMETRY_BASE_URL } from '@/config/api'
import type { LatestTelemetry, SimulatorDeviceType } from '@/types'

interface DeviceState {
  runningDevices: string[]
  telemetry: Record<string, LatestTelemetry>
  loading: boolean
  setRunningDevices: (devices: string[]) => void
  setTelemetry: (telemetry: Record<string, LatestTelemetry>) => void
  removeDevice: (deviceId: string) => void
  fetchRunningDevices: () => Promise<string[]>
  fetchTelemetryForDevices: (deviceIds: string[]) => Promise<void>
  refreshAll: () => Promise<void>
  startSimulation: (payload: {
    device_id: string
    device_type: SimulatorDeviceType
    interval: number
  }) => Promise<void>
  stopSimulation: (deviceId: string) => Promise<void>
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  runningDevices: [],
  telemetry: {},
  loading: false,

  setRunningDevices: (devices) => set({ runningDevices: devices }),

  setTelemetry: (telemetry) => set({ telemetry }),

  removeDevice: (deviceId) =>
    set((s) => {
      const { [deviceId]: _, ...rest } = s.telemetry
      return {
        runningDevices: s.runningDevices.filter((id) => id !== deviceId),
        telemetry: rest,
      }
    }),

  fetchRunningDevices: async () => {
    const res = await fetch(`${DEVICE_SIMULATOR_BASE_URL}/simulation/running`)
    if (!res.ok) throw new Error('Failed to fetch running simulations')
    const data = await res.json()
    const devices: string[] = data.running_devices ?? []
    set({ runningDevices: devices })
    return devices
  },

  fetchTelemetryForDevices: async (deviceIds) => {
    const entries = await Promise.all(
      deviceIds.map(async (deviceId) => {
        try {
          const res = await fetch(`${TELEMETRY_BASE_URL}/telemetry/latest/${deviceId}`)
          if (!res.ok) return [deviceId, null] as const
          const telemetry: LatestTelemetry = await res.json()
          return [deviceId, telemetry] as const
        } catch {
          return [deviceId, null] as const
        }
      }),
    )

    const nextMap: Record<string, LatestTelemetry> = {}
    for (const [id, telemetry] of entries) {
      if (telemetry) nextMap[id] = telemetry
    }
    set({ telemetry: nextMap })
  },

  refreshAll: async () => {
    set({ loading: true })
    try {
      const devices = await get().fetchRunningDevices()
      await get().fetchTelemetryForDevices(devices)
    } finally {
      set({ loading: false })
    }
  },

  startSimulation: async (payload) => {
    const res = await fetch(`${DEVICE_SIMULATOR_BASE_URL}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to add device.')
    await get().refreshAll()
  },

  stopSimulation: async (deviceId) => {
    const res = await fetch(`${DEVICE_SIMULATOR_BASE_URL}/simulation/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    })
    if (!res.ok) throw new Error('Failed to stop simulation')
    get().removeDevice(deviceId)
  },
}))
