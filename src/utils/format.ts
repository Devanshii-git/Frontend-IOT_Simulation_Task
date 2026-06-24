export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function formatMetric(value: number, metric: string): string {
  if (isNaN(value)) return 'N/A'
  if (metric.includes('temp') || metric === 'temperature') return `${value.toFixed(1)}°C`
  if (metric === 'humidity') return `${value.toFixed(1)}%`
  return value.toFixed(2)
}
