import type { LiveTelemetry } from '@/types'

type MessageHandler = (data: LiveTelemetry) => void

export class TelemetryWebSocket {
  private handlers = new Map<string, Set<MessageHandler>>()

  connect() {}

  disconnect() {
    this.handlers.clear()
  }

  send(_message: { action: string; deviceId?: string }) {}

  onMessage(deviceId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(deviceId)) this.handlers.set(deviceId, new Set())
    this.handlers.get(deviceId)!.add(handler)
    return () => this.handlers.get(deviceId)?.delete(handler)
  }
}

export const telemetryWs = new TelemetryWebSocket()
