import { create } from 'zustand'
import { DEVICE_SIMULATOR_BASE_URL, TELEMETRY_BASE_URL, USE_MOCK_API } from '@/config/api'

const MOCK_DEVICES: Device[] = [
  {
    id: 'device-temp-01',
    name: 'Office Thermostat',
    type: 'temperature_sensor',
    status: 'online',
    location: 'Building A, Floor 2',
    ipAddress: '192.168.1.15',
    protocol: 'MQTT',
    isToggledOn: true,
    signalStrength: 85,
    lastPing: new Date().toISOString(),
  },
  {
    id: 'device-cam-02',
    name: 'Front Door Camera',
    type: 'camera',
    status: 'online',
    location: 'Main Entrance',
    ipAddress: '192.168.1.24',
    protocol: 'HTTP',
    isToggledOn: true,
    signalStrength: 92,
    lastPing: new Date().toISOString(),
  },
  {
    id: 'device-spk-03',
    name: 'Conference Room Speaker',
    type: 'speaker',
    status: 'offline',
    location: 'Room 404',
    ipAddress: '192.168.1.32',
    protocol: 'HTTP',
    isToggledOn: false,
    signalStrength: 0,
    lastPing: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'device-mic-04',
    name: 'CEO Boardroom Mic',
    type: 'microphone',
    status: 'warning',
    location: 'Executive Suite',
    ipAddress: '192.168.1.41',
    protocol: 'WebSocket',
    isToggledOn: true,
    signalStrength: 60,
    lastPing: new Date().toISOString(),
  },
  {
    id: 'device-prj-05',
    name: 'Auditorium HD Projector',
    type: 'projector',
    status: 'online',
    location: 'Grand Auditorium',
    ipAddress: '192.168.1.55',
    protocol: 'MQTT',
    isToggledOn: true,
    signalStrength: 88,
    lastPing: new Date().toISOString(),
  },
]
import type { Device, DeviceStatus, DeviceType, DeviceProtocol, LatestTelemetry, SimulatorDeviceType } from '@/types'
import { useAuthStore } from './authStore'
import { httpClient } from '@/services/httpClient'

interface DeviceFilters {
  type: DeviceType | 'all'
  status: DeviceStatus | 'all'
  location: string
  search: string
}

interface DeviceState {
  devices: Device[]
  runningDevices: string[]
  telemetry: Record<string, LatestTelemetry>
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

const defaultFilters: DeviceFilters = { type: 'all', status: 'all', location: '', search: '' }

const KNOWN_DEVICE_TYPES: DeviceType[] = ['temperature_sensor', 'projector', 'camera', 'microphone', 'speaker']

const mapDeviceTypeName = (name: string): DeviceType => {
  const lower = name.toLowerCase()
  if (lower.includes('temp') || lower.includes('thermostat')) return 'temperature_sensor'
  if (lower.includes('projector')) return 'projector'
  if (lower.includes('camera') || lower.includes('cctv')) return 'camera'
  if (lower.includes('mic')) return 'microphone'
  if (lower.includes('speaker') || lower.includes('audio')) return 'speaker'
  const normalized = lower.replace(/\s+/g, '_') as DeviceType
  if (KNOWN_DEVICE_TYPES.includes(normalized)) return normalized
  console.warn(`Unknown device type name: "${name}", could not map to a known type`)
  return normalized
}

const getOrCreateUser = async (): Promise<string> => {
  const currentUser = useAuthStore.getState().user
  if (currentUser?.id) {
    return currentUser.id
  }
  const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
  try {
    const res = await httpClient.get(`${rootUrl}/users`)
    const users = res.data
    if (users && users.length > 0) {
      const currentEmail = useAuthStore.getState().user?.email
      const found = users.find((u: any) => u.email === currentEmail)
      return found ? found.id : users[0].id
    }
    const createRes = await httpClient.post(`${rootUrl}/users`, {
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'password123',
      role: 'user',
    })
    return createRes.data.id
  } catch (e) {
    console.error('Error getting or creating user', e)
  }
  return '00000000-0000-0000-0000-000000000000'
}

const typeDisplayNames: Record<string, string> = {
  temperature_sensor: 'Temperature Sensor',
  projector: 'Projector',
  camera: 'Camera',
  microphone: 'Microphone',
  speaker: 'Speaker',
}

const getOrCreateDeviceType = async (type: string): Promise<string> => {
  const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
  const displayName = typeDisplayNames[type] ?? type
  try {
    const res = await httpClient.get(`${rootUrl}/device-types`)
    const list = res.data
    const found = list.find((dt: any) =>
      dt.name.toLowerCase().includes(type.toLowerCase()) ||
      dt.name.toLowerCase().includes(displayName.toLowerCase())
    )
    if (found) return found.id

    const createRes = await httpClient.post(`${rootUrl}/device-types`, {
      name: displayName,
      description: `Device type for ${type}`,
    })
    return createRes.data.id
  } catch (e) {
    console.error('Error getting or creating device type', e)
  }
  return '00000000-0000-0000-0000-000000000000'
}

const getOrCreateProtocol = async (proto: string): Promise<string> => {
  const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
  try {
    const res = await httpClient.get(`${rootUrl}/protocols`)
    const list = res.data
    const found = list.find((p: any) => p.name.toUpperCase() === proto.toUpperCase())
    if (found) return found.id

    const createRes = await httpClient.post(`${rootUrl}/protocols`, {
      name: proto,
      description: `Protocol ${proto}`,
    })
    return createRes.data.id
  } catch (e) {
    console.error('Error getting or creating protocol', e)
  }
  return '00000000-0000-0000-0000-000000000000'
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  runningDevices: [],
  telemetry: {},
  loading: false,
  filters: { ...defaultFilters },

  setRunningDevices: (devices) => set({ runningDevices: devices }),
  setTelemetry: (telemetry) => set({ telemetry }),

  removeDevice: (deviceId) =>
    set((s) => {
      const nextTelemetry = { ...s.telemetry }
      delete nextTelemetry[deviceId]
      return {
        runningDevices: s.runningDevices.filter((id) => id !== deviceId),
        telemetry: nextTelemetry,
      }
    }),

  fetchDevices: async () => {
    set({ loading: true })
    if (USE_MOCK_API) {
      if (get().devices.length === 0) {
        set({
          devices: MOCK_DEVICES,
          runningDevices: MOCK_DEVICES.filter((d) => d.isToggledOn).map((d) => d.id),
        })
      }
      set({ loading: false })
      return
    }
    const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
    try {
      const [devsRes, typesRes, protosRes, configsRes] = await Promise.all([
        httpClient.get(`${rootUrl}/devices`).catch(() => ({ data: [] })),
        httpClient.get(`${rootUrl}/device-types`).catch(() => ({ data: [] })),
        httpClient.get(`${rootUrl}/protocols`).catch(() => ({ data: [] })),
        httpClient.get(`${rootUrl}/device-configurations`).catch(() => ({ data: [] })),
      ])

      const rawDevices = devsRes.data || []
      const deviceTypes = typesRes.data || []
      const protocols = protosRes.data || []
      const configurations = configsRes.data || []

      const typesMap = new Map<string, string>(deviceTypes.map((t: any) => [t.id, t.name]))
      const protosMap = new Map<string, string>(protocols.map((p: any) => [p.id, p.name]))
      const configsMap = new Map<string, Record<string, any>>(configurations.map((c: any) => [c.device_id, c.properties]))

      let activeRunning: string[] = []
      try {
        const simRes = await httpClient.get(`${DEVICE_SIMULATOR_BASE_URL}/simulation/running`)
        activeRunning = simRes.data.running_devices ?? []
      } catch (e) {
        console.warn('Simulation server unreachable for statuses', e)
      }

      const mappedDevices: Device[] = rawDevices.map((d: any) => {
        const typeName = typesMap.get(d.device_type_id) ?? d.device_type_id ?? 'unknown'
        const protoName = protosMap.get(d.protocol_id) ?? 'HTTP'
        const properties = configsMap.get(d.id) ?? {}
        const isRunning = activeRunning.includes(d.id)

        return {
          id: d.id,
          name: d.device_name,
          type: mapDeviceTypeName(typeName),
          status: isRunning ? 'online' : (d.status?.toLowerCase() === 'warning' ? 'warning' : 'offline'),
          location: properties.location ?? 'Unknown',
          ipAddress: d.ip_address ?? properties.ipAddress ?? '127.0.0.1',
          protocol: (protoName.toUpperCase() === 'MQTT' ? 'MQTT' : (protoName.toUpperCase() === 'WEBSOCKET' ? 'WebSocket' : 'HTTP')) as DeviceProtocol,
          isToggledOn: isRunning,
          signalStrength: 0,
          lastPing: d.updated_at || new Date().toISOString(),
        }
      })

      set({ devices: mappedDevices, runningDevices: activeRunning })
    } catch (err) {
      console.error('Error fetching devices, setting empty', err)
      set({ devices: [], runningDevices: [] })
    } finally {
      set({ loading: false })
    }
  },

  addDevice: async (payload) => {
    const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
    const userId = await getOrCreateUser()
    const deviceTypeId = await getOrCreateDeviceType(payload.type)
    const protocolId = await getOrCreateProtocol(payload.protocol)

    // 1. Create the Device
    const devRes = await httpClient.post(`${rootUrl}/devices`, {
      user_id: userId,
      device_type_id: deviceTypeId,
      protocol_id: protocolId,
      device_name: payload.name,
      status: 'CREATED',
      azure_device_id: null,
    })
    const newDevice = devRes.data

    // 2. Create Configuration properties (location & ipAddress)
    try {
      await httpClient.post(`${rootUrl}/device-configurations`, {
        device_id: newDevice.id,
        properties: {
          location: payload.location,
          ipAddress: payload.ipAddress,
        },
      })
    } catch (e) {
      console.warn('Failed to save device configuration properties', e)
    }

    await get().fetchDevices()
  },

  toggleDevice: async (id, isToggledOn) => {
    const device = get().devices.find((d) => d.id === id)
    if (!device) return

    try {
      if (isToggledOn) {
        const simType: SimulatorDeviceType = device.type as SimulatorDeviceType
        await get().startSimulation({
          device_id: id,
          device_type: simType,
          interval: 5,
        })
      } else {
        await get().stopSimulation(id)
      }
    } catch (e) {
      console.error('Error toggling device simulation', e)
    }
  },

  updateDeviceDetails: async (id, payload) => {
    const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
    const currentRes = await httpClient.get(`${rootUrl}/devices/${id}`)
    const current = currentRes.data

    let protocolId = current.protocol_id
    if (payload.protocol) {
      protocolId = await getOrCreateProtocol(payload.protocol)
    }

    let deviceTypeId = current.device_type_id
    if (payload.type) {
      deviceTypeId = await getOrCreateDeviceType(payload.type)
    }

    await httpClient.put(`${rootUrl}/devices/${id}`, {
      user_id: current.user_id,
      device_type_id: deviceTypeId,
      protocol_id: protocolId,
      device_name: payload.name ?? current.device_name,
      status: payload.status ?? current.status,
      azure_device_id: current.azure_device_id,
    })

    try {
      const configsRes = await httpClient.get(`${rootUrl}/device-configurations`)
      const configs = configsRes.data
      const config = configs.find((c: any) => c.device_id === id)

      const newProps = {
        location: payload.location ?? (config ? config.properties.location : 'Unknown'),
        ipAddress: payload.ipAddress ?? (config ? config.properties.ipAddress : '127.0.0.1'),
      }

      if (config) {
        await httpClient.put(`${rootUrl}/device-configurations/${config.id}`, {
          device_id: id,
          properties: newProps,
        })
      } else {
        await httpClient.post(`${rootUrl}/device-configurations`, {
          device_id: id,
          properties: newProps,
        })
      }
    } catch (e) {
      console.warn('Error updating device config', e)
    }

    await get().fetchDevices()
  },

  updateDeviceStatus: (id, status) => {
    set((s) => ({
      devices: s.devices.map((d) => (d.id === id ? { ...d, status } : d)),
    }))
  },

  deleteDevice: async (id) => {
    const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')

    if (get().runningDevices.includes(id)) {
      try {
        await get().stopSimulation(id)
      } catch (e) {
        console.warn('Failed to stop simulation before deleting', e)
      }
    }

    try {
      const configsRes = await httpClient.get(`${rootUrl}/device-configurations`)
      const configs = configsRes.data
      const config = configs.find((c: any) => c.device_id === id)
      if (config) {
        await httpClient.delete(`${rootUrl}/device-configurations/${config.id}`)
      }
    } catch (e) {
      console.warn('Error deleting associated configuration', e)
    }

    await httpClient.delete(`${rootUrl}/devices/${id}`)
    await get().fetchDevices()
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

  fetchRunningDevices: async () => {
    try {
      const res = await httpClient.get(`${DEVICE_SIMULATOR_BASE_URL}/simulation/running`)
      const devices: string[] = res.data.running_devices ?? []
      set({ runningDevices: devices })
      return devices
    } catch (e) {
      console.warn('Simulation server offline, using local running devices list:', e)
      const devices = get().devices.filter(d => d.isToggledOn).map(d => d.id)
      set({ runningDevices: devices })
      return devices
    }
  },

  fetchTelemetryForDevices: async (deviceIds) => {
    const entries = await Promise.all(
      deviceIds.map(async (deviceId) => {
        try {
          const res = await httpClient.get(`${TELEMETRY_BASE_URL}/telemetry/latest/${deviceId}`)
          const data = res.data
          const telemetry: LatestTelemetry = {
            device_id: deviceId,
            device_type: data.device_type,
            temperature: data.temperature,
            battery: data.battery_level ?? data.battery,
            volume: data.volume,
            brightness: data.brightness,
            fps: data.fps,
            timestamp: data.timestamp ?? new Date().toISOString(),
          }
          return [deviceId, telemetry] as const
        } catch {
          const device = get().devices.find(d => d.id === deviceId)
          const devType = device?.type ?? 'unknown'
          const simType: SimulatorDeviceType = devType as SimulatorDeviceType

          const mockTelemetry: LatestTelemetry = {
            device_id: deviceId,
            device_type: simType,
            temperature: simType === 'temperature_sensor' ? 0 : undefined,
            battery: 0,
            volume: simType === 'speaker' ? 0 : undefined,
            brightness: simType === 'projector' ? 0 : undefined,
            fps: simType === 'camera' ? 0 : undefined,
            timestamp: new Date().toISOString(),
          }
          return [deviceId, mockTelemetry] as const
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
      await get().fetchDevices()
      const devices = await get().fetchRunningDevices()
      await get().fetchTelemetryForDevices(devices)
    } catch (e) {
      console.error('Error refreshing all store status', e)
    } finally {
      set({ loading: false })
    }
  },

  startSimulation: async (payload) => {
    try {
      await httpClient.post(`${DEVICE_SIMULATOR_BASE_URL}/simulation/start`, payload)
      set(s => ({
        devices: s.devices.map(d => d.id === payload.device_id ? { ...d, isToggledOn: true, status: 'online' } : d),
        runningDevices: s.runningDevices.includes(payload.device_id) ? s.runningDevices : [...s.runningDevices, payload.device_id]
      }))
      await get().fetchTelemetryForDevices([payload.device_id])
    } catch (e) {
      console.warn('Simulation server offline, toggling device locally:', e)
      set(s => ({
        devices: s.devices.map(d => d.id === payload.device_id ? { ...d, isToggledOn: true, status: 'online' } : d),
        runningDevices: s.runningDevices.includes(payload.device_id) ? s.runningDevices : [...s.runningDevices, payload.device_id]
      }))
      await get().fetchTelemetryForDevices([payload.device_id])
    }
  },

  stopSimulation: async (deviceId) => {
    try {
      await httpClient.post(`${DEVICE_SIMULATOR_BASE_URL}/simulation/stop`, { device_id: deviceId })
      set(s => ({
        devices: s.devices.map(d => d.id === deviceId ? { ...d, isToggledOn: false, status: 'offline' } : d),
      }))
      get().removeDevice(deviceId)
    } catch (e) {
      console.warn('Simulation server offline, stopping device locally:', e)
      set(s => ({
        devices: s.devices.map(d => d.id === deviceId ? { ...d, isToggledOn: false, status: 'offline' } : d),
      }))
      get().removeDevice(deviceId)
    }
  },
}))
