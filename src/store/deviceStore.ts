import { create } from 'zustand'
import type { Device, DeviceStatus, DeviceType } from '@/types'
import { getDevicesApi, createDeviceApi, updateDeviceApi, deleteDeviceApi } from '@/services/api'

interface DeviceFilters {
  type: DeviceType | 'all'
  status: DeviceStatus | 'all'
  location: string
  search: string
}

interface DeviceState {
  devices: Device[]
  loading: boolean
  filters: DeviceFilters
  fetchDevices: () => Promise<void>
  addDevice: (payload: Omit<Device, 'id' | 'status' | 'isToggledOn' | 'signalStrength' | 'lastPing'>) => Promise<void>
  toggleDevice: (id: string, isToggledOn: boolean) => Promise<void>
  updateDeviceDetails: (id: string, payload: Partial<Device>) => Promise<void>
  updateDeviceStatus: (id: string, status: DeviceStatus) => void
  deleteDevice: (id: string) => Promise<void>
  setFilters: (filters: Partial<DeviceFilters>) => void
  clearFilters: () => void
  getFilteredDevices: () => Device[]
  getStats: () => { total: number; online: number; offline: number; warning: number; alerts: number }
}

const defaultFilters: DeviceFilters = { type: 'all', status: 'all', location: '', search: '' }

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  loading: false,
  filters: { ...defaultFilters },
  fetchDevices: async () => {
    set({ loading: true })
    try {
      const devices = await getDevicesApi()
      set({ devices })
    } finally {
      set({ loading: false })
    }
  },
  addDevice: async (payload) => {
    const device = await createDeviceApi(payload)
    set((s) => ({ devices: [...s.devices, device] }))
  },
  toggleDevice: async (id, isToggledOn) => {
    const updated = await updateDeviceApi(id, { isToggledOn })
    set((s) => ({ devices: s.devices.map((d) => (d.id === id ? updated : d)) }))
  },
  updateDeviceDetails: async (id, payload) => {
    const updated = await updateDeviceApi(id, payload)
    set((s) => ({ devices: s.devices.map((d) => (d.id === id ? updated : d)) }))
  },
  updateDeviceStatus: (id, status) => {
    set((s) => ({ devices: s.devices.map((d) => (d.id === id ? { ...d, status } : d)) }))
  },
  deleteDevice: async (id) => {
    await deleteDeviceApi(id)
    set((s) => ({ devices: s.devices.filter((d) => d.id !== id) }))
  },
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: { ...defaultFilters } }),
  getFilteredDevices: () => {
    const { devices, filters } = get()
    return devices.filter((d) => {
      if (filters.type !== 'all' && d.type !== filters.type) return false
      if (filters.status !== 'all' && d.status !== filters.status) return false
      if (filters.location && !d.location.toLowerCase().includes(filters.location.toLowerCase())) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!d.name.toLowerCase().includes(q) && !d.location.toLowerCase().includes(q)) return false
      }
      return true
    })
  },
  getStats: () => {
    const { devices } = get()
    return {
      total: devices.length,
      online: devices.filter((d) => d.status === 'online').length,
      offline: devices.filter((d) => d.status === 'offline').length,
      warning: devices.filter((d) => d.status === 'warning').length,
      alerts: devices.filter((d) => d.status === 'warning' || d.status === 'offline').length,
    }
  },
}))
