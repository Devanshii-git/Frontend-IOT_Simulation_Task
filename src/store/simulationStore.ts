import { create } from 'zustand'
import type { SimulationConfig, SimulationPreset } from '@/types'
import { applyPresetWaveform } from '@/utils/waveforms'

interface SimulationState {
  config: SimulationConfig
  tick: number
  log: string[]
  intervalId: ReturnType<typeof setInterval> | null
  setConfig: (partial: Partial<SimulationConfig>) => void
  applyPreset: (preset: SimulationPreset) => void
  start: () => void
  stop: () => void
}

const defaultConfig: SimulationConfig = {
  waveform: 'sine',
  frequencyMs: 1000,
  min: 10,
  max: 40,
  preset: 'normal',
  running: false,
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  config: { ...defaultConfig },
  tick: 0,
  log: [],
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
  },

  start: () => {
    const { intervalId } = get()
    if (intervalId) return
    set((s) => ({ config: { ...s.config, running: true } }))
  },

  stop: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set((s) => ({ intervalId: null, config: { ...s.config, running: false } }))
  },
}))
