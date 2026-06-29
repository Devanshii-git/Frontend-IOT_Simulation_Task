import type { LatestTelemetry, SimulatorDeviceType } from '@/types'

export const SIMULATOR_DEVICE_TYPE_OPTIONS: { value: SimulatorDeviceType; label: string }[] = [
  { value: 'temperature_sensor', label: 'Temperature Sensor' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'camera', label: 'Camera' },
  { value: 'microphone', label: 'Microphone' },
  { value: 'projector', label: 'Projector' },
]

export const SIMULATOR_DEVICE_TYPE_LABELS: Record<SimulatorDeviceType, string> = {
  temperature_sensor: 'Temperature Sensor',
  speaker: 'Speaker',
  camera: 'Camera',
  microphone: 'Microphone',
  projector: 'Projector',
}

export function formatSimulatorTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export function getPrimaryMetricKey(deviceType: SimulatorDeviceType): keyof LatestTelemetry {
  switch (deviceType) {
    case 'temperature_sensor':
      return 'temperature'
    case 'speaker':
      return 'volume'
    case 'camera':
      return 'fps'
    case 'microphone':
      return 'battery'
    case 'projector':
      return 'brightness'
  }
}
