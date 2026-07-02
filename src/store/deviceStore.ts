import { create } from 'zustand'
import { DEVICE_SIMULATOR_BASE_URL, TELEMETRY_BASE_URL, USE_MOCK_API } from '@/config/api'
import type { Device, DeviceStatus, DeviceType, DeviceProtocol, LatestTelemetry, SimulatorDeviceType } from '@/types'
import { useAuthStore } from './authStore'

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

const mapDeviceTypeName = (name: string): DeviceType => {
  const lower = name.toLowerCase()
  if (lower.includes('temp') || lower.includes('thermostat')) return 'temperature_sensor'
  if (lower.includes('projector')) return 'projector'
  if (lower.includes('camera') || lower.includes('cctv')) return 'camera'
  if (lower.includes('mic')) return 'microphone'
  if (lower.includes('speaker') || lower.includes('audio')) return 'speaker'
  return 'temperature_sensor'
}

const getOrCreateUser = async (): Promise<string> => {
  const currentUser = useAuthStore.getState().user
  if (currentUser?.id) {
    return currentUser.id
  }
  const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
  try {
    const res = await fetch(`${rootUrl}/users`)
    if (res.ok) {
      const users = await res.json()
      if (users && users.length > 0) {
        // Try to match email of currently logged-in user, or return first
        const currentEmail = useAuthStore.getState().user?.email
        const found = users.find((u: any) => u.email === currentEmail)
        return found ? found.id : users[0].id
      }
    }
    // Create default user if list is empty
    const createRes = await fetch(`${rootUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123',
        role: 'user',
      }),
    })
    if (createRes.ok) {
      const newUser = await createRes.json()
      return newUser.id
    }
  } catch (e) {
    console.error('Error getting or creating user', e)
  }
  return '00000000-0000-0000-0000-000000000000'
}

const getOrCreateDeviceType = async (type: string): Promise<string> => {
  const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
  try {
    const res = await fetch(`${rootUrl}/device-types`)
    if (res.ok) {
      const list = await res.json()
      let searchName = 'Temperature Sensor'
      if (type === 'projector') searchName = 'Projector'
      else if (type === 'camera') searchName = 'Camera'
      else if (type === 'microphone') searchName = 'Microphone'
      else if (type === 'speaker') searchName = 'Speaker'
      
      const found = list.find((dt: any) => 
        dt.name.toLowerCase().includes(type.toLowerCase()) || 
        dt.name.toLowerCase().includes(searchName.toLowerCase())
      )
      if (found) return found.id
      if (list.length > 0) return list[0].id
    }
    // Create new
    let dtName = 'Temperature Sensor'
    if (type === 'projector') dtName = 'Projector'
    else if (type === 'camera') dtName = 'Camera'
    else if (type === 'microphone') dtName = 'Microphone'
    else if (type === 'speaker') dtName = 'Speaker'
    const createRes = await fetch(`${rootUrl}/device-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: dtName,
        description: `Device type for ${type}`,
      }),
    })
    if (createRes.ok) {
      const newType = await createRes.json()
      return newType.id
    }
  } catch (e) {
    console.error('Error getting or creating device type', e)
  }
  return '00000000-0000-0000-0000-000000000000'
}

const getOrCreateProtocol = async (proto: string): Promise<string> => {
  const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
  try {
    const res = await fetch(`${rootUrl}/protocols`)
    if (res.ok) {
      const list = await res.json()
      const found = list.find((p: any) => p.name.toUpperCase() === proto.toUpperCase())
      if (found) return found.id
      if (list.length > 0) return list[0].id
    }
    // Create it
    const createRes = await fetch(`${rootUrl}/protocols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: proto,
        description: `Protocol ${proto}`,
      }),
    })
    if (createRes.ok) {
      const newProto = await createRes.json()
      return newProto.id
    }
  } catch (e) {
    console.error('Error getting or creating protocol', e)
  }
  return '00000000-0000-0000-0000-000000000000'
}

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
  }
]

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
        fetch(`${rootUrl}/devices`),
        fetch(`${rootUrl}/device-types`),
        fetch(`${rootUrl}/protocols`),
        fetch(`${rootUrl}/device-configurations`),
      ])

      const rawDevices = devsRes.ok ? await devsRes.json() : []
      const deviceTypes = typesRes.ok ? await typesRes.json() : []
      const protocols = protosRes.ok ? await protosRes.json() : []
      const configurations = configsRes.ok ? await configsRes.json() : []

      const typesMap = new Map<string, string>(deviceTypes.map((t: any) => [t.id, t.name]))
      const protosMap = new Map<string, string>(protocols.map((p: any) => [p.id, p.name]))
      const configsMap = new Map<string, Record<string, any>>(configurations.map((c: any) => [c.device_id, c.properties]))

      // Read running simulations to set the isToggledOn flag
      let activeRunning: string[] = []
      try {
        const simRes = await fetch(`${DEVICE_SIMULATOR_BASE_URL}/simulation/running`)
        if (simRes.ok) {
          const simData = await simRes.json()
          activeRunning = simData.running_devices ?? []
        }
      } catch (e) {
        console.warn('Simulation server unreachable for statuses', e)
      }

      const mappedDevices: Device[] = rawDevices.map((d: any) => {
        const typeName = typesMap.get(d.device_type_id) ?? 'custom'
        const protoName = protosMap.get(d.protocol_id) ?? 'HTTP'
        const properties = configsMap.get(d.id) ?? {}

        const isRunning = activeRunning.includes(d.id)

        return {
          id: d.id,
          name: d.device_name,
          type: mapDeviceTypeName(typeName),
          status: isRunning ? 'online' : (d.status?.toLowerCase() === 'warning' ? 'warning' : 'offline'),
          location: properties.location ?? 'Unknown',
          ipAddress: properties.ipAddress ?? '127.0.0.1',
          protocol: (protoName.toUpperCase() === 'MQTT' ? 'MQTT' : (protoName.toUpperCase() === 'WEBSOCKET' ? 'WebSocket' : 'HTTP')) as DeviceProtocol,
          isToggledOn: isRunning,
          signalStrength: 0,
          lastPing: d.updated_at || new Date().toISOString(),
        }
      })

      if (mappedDevices.length === 0) {
        set({ devices: [], runningDevices: [] })
      } else {
        set({ devices: mappedDevices, runningDevices: activeRunning })
      }
    } catch (err) {
      console.error('Error fetching devices, setting empty', err)
      set({ devices: [], runningDevices: [] })
    } finally {
      set({ loading: false })
    }
  },

  addDevice: async (payload) => {
    if (USE_MOCK_API) {
      const newDevice: Device = {
        id: `mock-device-${Date.now()}`,
        name: payload.name,
        type: payload.type,
        status: 'offline',
        location: payload.location,
        ipAddress: payload.ipAddress || '127.0.0.1',
        protocol: payload.protocol,
        isToggledOn: false,
        signalStrength: 0,
        lastPing: new Date().toISOString(),
      }
      set((s) => ({ devices: [...s.devices, newDevice] }))
      return
    }

    const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
    const userId = await getOrCreateUser()
    const deviceTypeId = await getOrCreateDeviceType(payload.type)
    const protocolId = await getOrCreateProtocol(payload.protocol)

    // 1. Create the Device
    const devRes = await fetch(`${rootUrl}/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        device_type_id: deviceTypeId,
        protocol_id: protocolId,
        device_name: payload.name,
        status: 'CREATED',
        azure_device_id: null,
      }),
    })

    if (!devRes.ok) {
      throw new Error(`Failed to create device: ${await devRes.text()}`)
    }
    const newDevice = await devRes.json()

    // 2. Create the Configuration properties (location & ipAddress)
    const configRes = await fetch(`${rootUrl}/device-configurations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: newDevice.id,
        properties: {
          location: payload.location,
          ipAddress: payload.ipAddress,
        },
      }),
    })

    if (!configRes.ok) {
      console.warn('Failed to save device configuration properties', await configRes.text())
    }

    await get().fetchDevices()
  },

  toggleDevice: async (id, isToggledOn) => {
    if (USE_MOCK_API) {
      set((s) => ({
        devices: s.devices.map((d) => (d.id === id ? { ...d, isToggledOn, status: isToggledOn ? 'online' : 'offline' } : d)),
        runningDevices: isToggledOn
          ? s.runningDevices.includes(id) ? s.runningDevices : [...s.runningDevices, id]
          : s.runningDevices.filter((dId) => dId !== id)
      }))
      await get().refreshAll()
      return
    }

    // Starting or stopping simulator simulation dynamically toggles it
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

    // Refresh devices list to fetch statuses
    await get().fetchDevices()
  },

  updateDeviceDetails: async (id, payload) => {
    if (USE_MOCK_API) {
      set((s) => ({
        devices: s.devices.map((d) => (d.id === id ? { ...d, ...payload } : d))
      }))
      return
    }

    const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
    
    // Fetch current backend model because all fields in DeviceBase are required for updates
    const currentRes = await fetch(`${rootUrl}/devices/${id}`)
    if (!currentRes.ok) throw new Error('Device not found on backend')
    const current = await currentRes.json()

    let protocolId = current.protocol_id
    if (payload.protocol) {
      protocolId = await getOrCreateProtocol(payload.protocol)
    }

    let deviceTypeId = current.device_type_id
    if (payload.type) {
      deviceTypeId = await getOrCreateDeviceType(payload.type)
    }

    // 1. Update basic details
    const devRes = await fetch(`${rootUrl}/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: current.user_id,
        device_type_id: deviceTypeId,
        protocol_id: protocolId,
        device_name: payload.name ?? current.device_name,
        status: payload.status ?? current.status,
        azure_device_id: current.azure_device_id,
      }),
    })

    if (!devRes.ok) {
      throw new Error(`Failed to update device: ${await devRes.text()}`)
    }

    // 2. Update configuration properties
    const configsRes = await fetch(`${rootUrl}/device-configurations`)
    if (configsRes.ok) {
      const configs = await configsRes.json()
      const config = configs.find((c: any) => c.device_id === id)
      
      const newProps = {
        location: payload.location ?? (config ? config.properties.location : 'Unknown'),
        ipAddress: payload.ipAddress ?? (config ? config.properties.ipAddress : '127.0.0.1'),
      }

      if (config) {
        await fetch(`${rootUrl}/device-configurations/${config.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: id,
            properties: newProps,
          }),
        })
      } else {
        await fetch(`${rootUrl}/device-configurations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            device_id: id,
            properties: newProps,
          }),
        })
      }
    }

    await get().fetchDevices()
  },

  updateDeviceStatus: (id, status) => {
    set((s) => ({
      devices: s.devices.map((d) => (d.id === id ? { ...d, status } : d)),
    }))
  },

  deleteDevice: async (id) => {
    if (USE_MOCK_API) {
      set((s) => ({
        devices: s.devices.filter((d) => d.id !== id),
        runningDevices: s.runningDevices.filter((dId) => dId !== id)
      }))
      return
    }

    const rootUrl = TELEMETRY_BASE_URL.replace('/api/v1', '')
    
    // Stop simulation first if it's running
    if (get().runningDevices.includes(id)) {
      try {
        await get().stopSimulation(id)
      } catch (e) {
        console.warn('Failed to stop simulation before deleting', e)
      }
    }

    // 1. Delete associated configuration first to satisfy foreign keys
    try {
      const configsRes = await fetch(`${rootUrl}/device-configurations`)
      if (configsRes.ok) {
        const configs = await configsRes.json()
        const config = configs.find((c: any) => c.device_id === id)
        if (config) {
          await fetch(`${rootUrl}/device-configurations/${config.id}`, {
            method: 'DELETE',
          })
        }
      }
    } catch (e) {
      console.warn('Error deleting associated configuration', e)
    }

    // 2. Delete the device
    const res = await fetch(`${rootUrl}/devices/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      throw new Error(`Failed to delete device: ${await res.text()}`)
    }

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
    if (USE_MOCK_API) {
      return get().runningDevices
    }

    try {
      const res = await fetch(`${DEVICE_SIMULATOR_BASE_URL}/simulation/running`)
      if (!res.ok) throw new Error('Failed to fetch running simulations')
      const data = await res.json()
      const devices: string[] = data.running_devices ?? []
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
    if (USE_MOCK_API) {
      const entries = deviceIds.map((deviceId) => {
        const device = get().devices.find(d => d.id === deviceId)
        const devType = device?.type ?? 'temperature_sensor'
        const simType: SimulatorDeviceType = devType as SimulatorDeviceType
        
        const mockTelemetry: LatestTelemetry = {
          device_id: deviceId,
          device_type: simType,
          temperature: simType === 'temperature_sensor' ? Math.floor(20 + Math.random() * 10) : undefined,
          battery: Math.floor(70 + Math.random() * 30),
          volume: simType === 'speaker' ? Math.floor(30 + Math.random() * 40) : undefined,
          brightness: simType === 'projector' ? Math.floor(50 + Math.random() * 50) : undefined,
          fps: simType === 'camera' ? Math.floor(24 + Math.random() * 6) : undefined,
          timestamp: new Date().toISOString(),
        }
        return [deviceId, mockTelemetry] as const
      })

      const nextMap: Record<string, LatestTelemetry> = {}
      for (const [id, telemetry] of entries) {
        if (telemetry) nextMap[id] = telemetry
      }
      set({ telemetry: nextMap })
      return
    }

    const entries = await Promise.all(
      deviceIds.map(async (deviceId) => {
        try {
          const res = await fetch(`${TELEMETRY_BASE_URL}/telemetry/latest/${deviceId}`)
          if (!res.ok) throw new Error('Unsuccessful telemetry fetch')
          const data: any = await res.json()
          // Map backend 'battery_level' to frontend 'battery' if present
          const telemetry: LatestTelemetry = {
            device_id: deviceId,
            device_type: data.device_type ?? 'temperature_sensor',
            temperature: data.temperature,
            battery: data.battery_level ?? data.battery,
            volume: data.volume,
            brightness: data.brightness,
            fps: data.fps,
            timestamp: data.timestamp ?? new Date().toISOString(),
          }
          return [deviceId, telemetry] as const
        } catch {
          // Offline fallback: return randomized mock telemetry!
          const device = get().devices.find(d => d.id === deviceId)
          const devType = device?.type ?? 'temperature_sensor'
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
    if (USE_MOCK_API) {
      set((s) => ({
        devices: s.devices.map((d) => (d.id === payload.device_id ? { ...d, isToggledOn: true, status: 'online' } : d)),
        runningDevices: s.runningDevices.includes(payload.device_id) ? s.runningDevices : [...s.runningDevices, payload.device_id],
      }))
      await get().refreshAll()
      return
    }

    try {
      const res = await fetch(`${DEVICE_SIMULATOR_BASE_URL}/simulation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to start simulation.')
      await get().refreshAll()
    } catch (e) {
      console.warn('Simulation server offline, toggling device locally:', e)
      set(s => ({
        devices: s.devices.map(d => d.id === payload.device_id ? { ...d, isToggledOn: true, status: 'online' } : d),
        runningDevices: s.runningDevices.includes(payload.device_id) ? s.runningDevices : [...s.runningDevices, payload.device_id]
      }))
      await get().refreshAll()
    }
  },

  stopSimulation: async (deviceId) => {
    if (USE_MOCK_API) {
      set((s) => ({
        devices: s.devices.map((d) => (d.id === deviceId ? { ...d, isToggledOn: false, status: 'offline' } : d)),
        runningDevices: s.runningDevices.filter((id) => id !== deviceId)
      }))
      get().removeDevice(deviceId)
      return
    }

    try {
      const res = await fetch(`${DEVICE_SIMULATOR_BASE_URL}/simulation/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId }),
      })
      if (!res.ok) throw new Error('Failed to stop simulation')
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
