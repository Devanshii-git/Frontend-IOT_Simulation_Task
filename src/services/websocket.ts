import type { LiveTelemetry } from '@/types'
import { WS_BASE_URL, USE_MOCK_API } from '@/config/api'
import { useDeviceStore } from '@/store/deviceStore'
import { useAuthStore } from '@/store/authStore'

type MessageHandler = (data: LiveTelemetry) => void

export class TelemetryWebSocket {
  private handlers = new Map<string, Set<MessageHandler>>()
  private sockets = new Map<string, WebSocket>()
  
  // Real WebSocket reconnect tracking
  private reconnectAttempts = new Map<string, number>()
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()

  // Local simulator tracking for mock mode
  private mockIntervals = new Map<string, ReturnType<typeof setInterval>>()

  connect() {
    // Sockets are initialized on-demand per device ID in subscribe action
  }

  disconnect() {
    // Disconnect real sockets
    this.sockets.forEach((ws) => {
      try {
        ws.close()
      } catch {
        // ignore
      }
    })
    this.sockets.clear()

    // Clear reconnect timers
    this.reconnectTimers.forEach((timer) => clearTimeout(timer))
    this.reconnectTimers.clear()
    this.reconnectAttempts.clear()

    // Clear mock simulator intervals
    this.mockIntervals.forEach((interval) => clearInterval(interval))
    this.mockIntervals.clear()

    this.handlers.clear()
  }

  send(message: { action: string; deviceId?: string }) {
    const { action, deviceId } = message
    if (!deviceId) return

    if (action === 'subscribe') {
      if (USE_MOCK_API) {
        this.startMockSimulation(deviceId)
      } else {
        this.connectSocket(deviceId)
      }
    } else if (action === 'unsubscribe') {
      if (USE_MOCK_API) {
        this.stopMockSimulation(deviceId)
      } else {
        this.disconnectSocket(deviceId)
      }
    }
  }

  onMessage(deviceId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(deviceId)) this.handlers.set(deviceId, new Set())
    this.handlers.get(deviceId)!.add(handler)
    return () => {
      const set = this.handlers.get(deviceId)
      if (set) {
        set.delete(handler)
        if (set.size === 0) {
          this.handlers.delete(deviceId)
        }
      }
    }
  }

  // --- Real WebSocket Connection Logic ---

  private connectSocket(deviceId: string) {
    if (this.sockets.has(deviceId)) return

    let wsBase = WS_BASE_URL
    if (wsBase.startsWith('http:')) {
      wsBase = wsBase.replace(/^http:/, 'ws:')
    } else if (wsBase.startsWith('https:')) {
      wsBase = wsBase.replace(/^https:/, 'wss:')
    }

    // Append auth token if present in auth state
    const token = useAuthStore.getState().token
    const wsUrl = `${wsBase}/telemetry/ws/${deviceId}${token ? `?token=${encodeURIComponent(token)}` : ''}`

    try {
      const ws = new WebSocket(wsUrl)
      this.sockets.set(deviceId, ws)

      ws.onopen = () => {
        console.log(`WebSocket connected for device ${deviceId}`)
        this.reconnectAttempts.delete(deviceId)
      }

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data)
          const deviceType = raw.device_type || ''
          const metrics = raw.metrics || {}
          
          let metric = 'cpu'
          let value = 0
          
          const typeLower = deviceType.toLowerCase()
          if (typeLower.includes('temp') || typeLower.includes('thermostat')) {
            metric = 'temperature'
            value = metrics.temperature ?? metrics.temp ?? 0
          } else if (typeLower.includes('camera') || typeLower.includes('cctv')) {
            metric = 'fps'
            value = metrics.fps ?? 0
          } else if (typeLower.includes('mic') || typeLower.includes('speaker') || typeLower.includes('audio')) {
            metric = 'volume'
            value = metrics.volume ?? metrics.audio_level ?? 0
          } else if (typeLower.includes('projector')) {
            metric = 'brightness'
            value = metrics.brightness ?? 0
          } else {
            const keys = Object.keys(metrics)
            const firstNumericKey = keys.find(k => typeof metrics[k] === 'number')
            if (firstNumericKey) {
              metric = firstNumericKey
              value = metrics[firstNumericKey]
            } else if (keys.length > 0) {
              metric = keys[0]
              value = Number(metrics[keys[0]]) || 0
            }
          }
          
          const liveData: LiveTelemetry = {
            deviceId: raw.device_id || deviceId,
            timestamp: raw.timestamp || new Date().toISOString(),
            metric,
            value,
            signalStrength: Math.floor(70 + Math.random() * 25)
          }
          
          const handlersForDevice = this.handlers.get(deviceId)
          if (handlersForDevice) {
            handlersForDevice.forEach(handler => handler(liveData))
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (err) => {
        console.error(`WebSocket error for device ${deviceId}:`, err)
      }

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed for device ${deviceId}`, event)
        this.sockets.delete(deviceId)

        // Attempt reconnection if client handlers are still registered
        if (this.handlers.has(deviceId)) {
          this.scheduleReconnect(deviceId)
        }
      }
    } catch (err) {
      console.error(`Failed to create WebSocket for device ${deviceId}:`, err)
      this.scheduleReconnect(deviceId)
    }
  }

  private disconnectSocket(deviceId: string) {
    const ws = this.sockets.get(deviceId)
    if (ws) {
      try {
        ws.close()
      } catch {
        // ignore
      }
      this.sockets.delete(deviceId)
    }

    // Clear any pending reconnection state
    const timer = this.reconnectTimers.get(deviceId)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(deviceId)
    }
    this.reconnectAttempts.delete(deviceId)
  }

  private scheduleReconnect(deviceId: string) {
    if (this.reconnectTimers.has(deviceId)) return

    const attempt = this.reconnectAttempts.get(deviceId) ?? 0
    if (attempt >= 10) {
      console.error(`Max WebSocket reconnect attempts reached for device ${deviceId}`)
      return
    }

    // Exponential backoff capped at 30 seconds
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
    this.reconnectAttempts.set(deviceId, attempt + 1)

    console.log(`Scheduling reconnect for device ${deviceId} in ${delay}ms (attempt ${attempt + 1})`)
    const timer = setTimeout(() => {
      this.reconnectTimers.delete(deviceId)
      this.connectSocket(deviceId)
    }, delay)

    this.reconnectTimers.set(deviceId, timer)
  }

  // --- Local Mock Simulation Logic ---

  private startMockSimulation(deviceId: string) {
    if (this.mockIntervals.has(deviceId)) return

    console.log(`Starting local mock telemetry simulation for device ${deviceId}`)

    const interval = setInterval(() => {
      const device = useDeviceStore.getState().devices.find((d) => d.id === deviceId)
      const deviceType = device?.type || ''
      const typeLower = deviceType.toLowerCase()

      let metric: string
      let value: number

      // Generate realistic dynamic readings depending on device types
      if (typeLower.includes('temp') || typeLower.includes('thermostat')) {
        metric = 'temperature'
        value = Math.floor(20 + Math.sin(Date.now() / 10000) * 5 + Math.random() * 2)
      } else if (typeLower.includes('camera') || typeLower.includes('cctv')) {
        metric = 'fps'
        value = Math.floor(25 + Math.random() * 5)
      } else if (typeLower.includes('mic') || typeLower.includes('speaker') || typeLower.includes('audio')) {
        metric = 'volume'
        value = Math.floor(40 + Math.sin(Date.now() / 5000) * 15 + Math.random() * 5)
      } else if (typeLower.includes('projector')) {
        metric = 'brightness'
        value = Math.floor(70 + Math.random() * 15)
      } else {
        metric = 'cpu'
        value = Math.floor(15 + Math.sin(Date.now() / 8000) * 10 + Math.random() * 5)
      }

      const liveData: LiveTelemetry = {
        deviceId,
        timestamp: new Date().toISOString(),
        metric,
        value,
        signalStrength: Math.floor(75 + Math.random() * 20)
      }

      const handlersForDevice = this.handlers.get(deviceId)
      if (handlersForDevice) {
        handlersForDevice.forEach((handler) => handler(liveData))
      }
    }, 1000)

    this.mockIntervals.set(deviceId, interval)
  }

  private stopMockSimulation(deviceId: string) {
    const interval = this.mockIntervals.get(deviceId)
    if (interval) {
      clearInterval(interval)
      this.mockIntervals.delete(deviceId)
      console.log(`Stopped local mock telemetry simulation for device ${deviceId}`)
    }
  }
}

export const telemetryWs = new TelemetryWebSocket()
