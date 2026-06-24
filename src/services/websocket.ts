import type { LiveTelemetry } from '@/types'

type MessageHandler = (data: LiveTelemetry) => void
type SubscribeMessage = { action: 'subscribe'; deviceId: string }
type UnsubscribeMessage = { action: 'unsubscribe'; deviceId: string }

/**
 * Mock WebSocket client mirroring ws://api/telemetry/live contract.
 * Uses EventTarget internally; real WS would replace send/onmessage.
 */
export class MockTelemetryWebSocket {
  private handlers = new Map<string, Set<MessageHandler>>()
  private intervals = new Map<string, ReturnType<typeof setInterval>>()
  private connected = false
  private tick = 0

  connect(): void {
    this.connected = true
  }

  disconnect(): void {
    this.connected = false
    this.intervals.forEach((id) => clearInterval(id))
    this.intervals.clear()
    this.handlers.clear()
  }

  send(msg: SubscribeMessage | UnsubscribeMessage): void {
    if (!this.connected) return
    if (msg.action === 'subscribe') {
      this.startStream(msg.deviceId)
    } else {
      this.stopStream(msg.deviceId)
    }
  }

  onMessage(deviceId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(deviceId)) this.handlers.set(deviceId, new Set())
    this.handlers.get(deviceId)!.add(handler)
    return () => this.handlers.get(deviceId)?.delete(handler)
  }

  /** Called by simulation engine to push live data */
  emit(data: LiveTelemetry): void {
    const handlers = this.handlers.get(data.deviceId)
    handlers?.forEach((h) => h(data))
  }

  private startStream(deviceId: string): void {
    if (this.intervals.has(deviceId)) return
    const id = setInterval(() => {
      this.tick++
      const payload: LiveTelemetry = {
        deviceId,
        timestamp: new Date().toISOString(),
        metric: 'temperature',
        value: 22 + Math.sin(this.tick * 0.1) * 5,
        signalStrength: 70 + Math.floor(Math.random() * 25),
      }
      this.emit(payload)
    }, 2000)
    this.intervals.set(deviceId, id)
  }

  private stopStream(deviceId: string): void {
    const id = this.intervals.get(deviceId)
    if (id) clearInterval(id)
    this.intervals.delete(deviceId)
  }
}

export const telemetryWs = new MockTelemetryWebSocket()
