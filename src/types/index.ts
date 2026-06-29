export type SimulatorDeviceType =
  | 'temperature_sensor'
  | 'speaker'
  | 'camera'
  | 'microphone'
  | 'projector'

export interface LatestTelemetry {
  device_id: string
  device_type: SimulatorDeviceType
  temperature?: number
  battery?: number
  volume?: number
  brightness?: number
  fps?: number
  timestamp: string
}

export type DeviceType =
  | 'temperature'
  | 'humidity'
  | 'motion'
  | 'smart-plug'
  | 'cctv'
  | 'custom'

export type DeviceStatus = 'online' | 'offline' | 'warning'

export type DeviceProtocol = 'MQTT' | 'HTTP' | 'WebSocket'

export interface Device {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  location: string
  ipAddress: string
  protocol: DeviceProtocol
  isToggledOn: boolean
  signalStrength: number
  lastPing: string
}

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Alert {
  id: string
  deviceId: string
  deviceName: string
  severity: AlertSeverity
  condition: string
  value: string
  timestamp: string
  acknowledged: boolean
}

export type AlertCondition = 'gt' | 'lt' | 'eq' | 'gte' | 'lte'

export interface AlertRule {
  id: string
  deviceId: string
  deviceName: string
  metric: string
  condition: AlertCondition
  threshold: number
  notifyVia: ('email' | 'sms' | 'push')[]
  enabled: boolean
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface TelemetryPoint {
  timestamp: string
  value: number
}

export interface LiveTelemetry {
  deviceId: string
  timestamp: string
  metric: string
  value: number
  signalStrength: number
}

export type WaveformType = 'sine' | 'random' | 'spike' | 'flatline'

export type SimulationPreset =
  | 'normal'
  | 'sensor-fault'
  | 'network-degradation'
  | 'overload-spike'

export interface SimulationConfig {
  waveform: WaveformType
  frequencyMs: number
  min: number
  max: number
  preset: SimulationPreset
  running: boolean
}

export interface ActivityItem {
  id: string
  message: string
  timestamp: string
  type: 'info' | 'warning' | 'success' | 'error'
}

export interface AuthResponse {
  token: string
  user: User
}
