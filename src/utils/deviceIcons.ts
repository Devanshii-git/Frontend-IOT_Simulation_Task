import {
  Thermometer, Droplets, Radio, Plug, Camera, Box,
  type LucideIcon,
} from 'lucide-react'
import type { DeviceType } from '@/types'

export const deviceTypeConfig: Record<DeviceType, { label: string; icon: LucideIcon; color: string }> = {
  temperature: { label: 'Temperature', icon: Thermometer, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30' },
  humidity: { label: 'Humidity', icon: Droplets, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
  motion: { label: 'Motion', icon: Radio, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30' },
  'smart-plug': { label: 'Smart Plugs', icon: Plug, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
  cctv: { label: 'CCTV', icon: Camera, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  custom: { label: 'Custom', icon: Box, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
}

export const deviceTypeOptions = Object.entries(deviceTypeConfig).map(([value, { label }]) => ({ value, label }))

export const protocolOptions = [
  { value: 'MQTT', label: 'MQTT' },
  { value: 'HTTP', label: 'HTTP' },
  { value: 'WebSocket', label: 'WebSocket' },
]
