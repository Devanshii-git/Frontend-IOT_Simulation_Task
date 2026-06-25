import {
  Thermometer, Droplets, Radio, Plug, Camera, Box,
  type LucideIcon,
} from 'lucide-react'
import type { DeviceType } from '@/types'

export const deviceTypeConfig: Record<DeviceType, { label: string; icon: LucideIcon; color: string }> = {
  temperature: { label: 'Temperature', icon: Thermometer, color: 'text-text-muted bg-bg-elevated' },
  humidity: { label: 'Humidity', icon: Droplets, color: 'text-text-muted bg-bg-elevated' },
  motion: { label: 'Motion', icon: Radio, color: 'text-text-muted bg-bg-elevated' },
  'smart-plug': { label: 'Smart Plugs', icon: Plug, color: 'text-text-muted bg-bg-elevated' },
  cctv: { label: 'CCTV', icon: Camera, color: 'text-text-muted bg-bg-elevated' },
  custom: { label: 'Custom', icon: Box, color: 'text-text-muted bg-bg-elevated' },
}

export const deviceTypeOptions = Object.entries(deviceTypeConfig).map(([value, { label }]) => ({ value, label }))

export const protocolOptions = [
  { value: 'MQTT', label: 'MQTT' },
  { value: 'HTTP', label: 'HTTP' },
  { value: 'WebSocket', label: 'WebSocket' },
]
