import type { WaveformType } from '@/types'

export function generateWaveValue(
  waveform: WaveformType,
  tick: number,
  min: number,
  max: number,
  preset?: string,
): number {
  const range = max - min
  const mid = (min + max) / 2

  if (preset === 'sensor-fault' || waveform === 'flatline') {
    return preset === 'sensor-fault' && Math.random() < 0.3 ? NaN : min
  }

  switch (waveform) {
    case 'sine':
      return mid + (range / 2) * Math.sin(tick * 0.1)
    case 'random':
      return min + Math.random() * range
    case 'spike':
      return Math.random() < 0.05 ? max * 1.5 : mid + (range / 4) * Math.sin(tick * 0.05)
    default:
      return min
  }
}

export function applyPresetWaveform(preset: string): WaveformType {
  switch (preset) {
    case 'sensor-fault':
      return 'flatline'
    case 'overload-spike':
      return 'spike'
    case 'network-degradation':
      return 'random'
    default:
      return 'sine'
  }
}
