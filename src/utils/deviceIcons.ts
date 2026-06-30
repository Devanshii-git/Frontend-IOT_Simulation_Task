import {
  Thermometer, Camera, Mic, Speaker, Projector,
  type LucideIcon,
} from 'lucide-react'
import type { DeviceType } from '@/types'

export const deviceTypeConfig: Record<DeviceType, { label: string; icon: LucideIcon; color: string }> = {
  projector: { label: 'Projector', icon: Projector, color: 'text-text-muted bg-bg-elevated' },
  camera: { label: 'Camera', icon: Camera, color: 'text-text-muted bg-bg-elevated' },
  microphone: { label: 'Microphone', icon: Mic, color: 'text-text-muted bg-bg-elevated' },
  speaker: { label: 'Speaker', icon: Speaker, color: 'text-text-muted bg-bg-elevated' },
  temperature_sensor: { label: 'Temperature Sensor', icon: Thermometer, color: 'text-text-muted bg-bg-elevated' },
}

export const deviceTypeOptions = Object.entries(deviceTypeConfig).map(([value, { label }]) => ({ value, label }))

export const protocolOptions = [
  { value: 'MQTT', label: 'MQTT' },
  { value: 'HTTP', label: 'HTTP' },
  { value: 'WebSocket', label: 'WebSocket' },
]
