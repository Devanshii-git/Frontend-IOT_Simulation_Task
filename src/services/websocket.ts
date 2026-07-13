import type { LiveTelemetry } from '@/types'
import { TELEMETRY_BASE_URL } from '@/config/api'

type MessageHandler = (data: LiveTelemetry) => void

export class TelemetryWebSocket {
  private handlers = new Map<string, Set<MessageHandler>>()
  private sockets = new Map<string, WebSocket>()

  connect() {
    // Sockets are initialized on-demand per device ID in subscribe action
  }

  disconnect() {
    this.sockets.forEach((ws) => {
      try {
        ws.close()
      } catch {
        // ignore
      }
    })
    this.sockets.clear()
    this.handlers.clear()
  }

  send(message: { action: string; deviceId?: string }) {
    const { action, deviceId } = message
    if (!deviceId) return

    if (action === 'subscribe') {
      if (this.sockets.has(deviceId)) return

      const wsBase = TELEMETRY_BASE_URL.replace(/^http/, 'ws')
      const wsUrl = `${wsBase}/telemetry/ws/${deviceId}`
      
      try {
        const ws = new WebSocket(wsUrl)
        
        ws.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data)
            const deviceType = raw.device_type || ''
            const metrics = raw.metrics || {}
            
            // Find the primary metric name and value
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
              // Fallback: look for any numeric value in metrics
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

        ws.onclose = () => {
          console.log(`WebSocket connection closed for device ${deviceId}`)
          this.sockets.delete(deviceId)
        }

        this.sockets.set(deviceId, ws)
      } catch (err) {
        console.error(`Failed to create WebSocket for device ${deviceId}:`, err)
      }
    } else if (action === 'unsubscribe') {
      const ws = this.sockets.get(deviceId)
      if (ws) {
        try {
          ws.close()
        } catch {
          // ignore
        }
        this.sockets.delete(deviceId)
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
}

export const telemetryWs = new TelemetryWebSocket()
