import type { TelemetryPoint } from '@/types'

export function exportToCSV(data: TelemetryPoint[], filename: string) {
  const header = 'timestamp,value\n'
  const rows = data.map((p) => `${p.timestamp},${p.value}`).join('\n')
  downloadFile(`${header}${rows}`, `${filename}.csv`, 'text/csv')
}

export function exportToJSON(data: TelemetryPoint[], filename: string) {
  downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json')
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
