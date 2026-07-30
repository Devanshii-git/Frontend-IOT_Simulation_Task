import { useEffect, useState, Suspense, lazy } from 'react'
import { Download, RefreshCw, Layers, Palette } from 'lucide-react'

const TelemetryChart = lazy(() => import('@/components/monitoring/TelemetryChart'))
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useDeviceStore } from '@/store/deviceStore'
import { getPrimaryMetricKey } from '@/utils/simulatorDevices'
import { exportTelemetryApi } from '@/services/api'
import { useToastStore } from '@/store/toastStore'
import type { SimulatorDeviceType } from '@/types'

const REFRESH_OPTIONS = [
  { value: '5000', label: '5 seconds' },
  { value: '10000', label: '10 seconds' },
  { value: '30000', label: '30 seconds' },
  { value: 'manual', label: 'Manual' },
]

function getMetricValue(
  deviceType: SimulatorDeviceType,
  telemetry: { temperature?: number; battery?: number; volume?: number; brightness?: number; fps?: number },
): number | null {
  const key = getPrimaryMetricKey(deviceType)
  const value = telemetry[key as keyof typeof telemetry]
  return typeof value === 'number' ? value : null
}

export function MonitoringPage() {
  const runningDevices = useDeviceStore((s) => s.runningDevices)
  const telemetry = useDeviceStore((s) => s.telemetry)
  const refreshAll = useDeviceStore((s) => s.refreshAll)
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [refreshInterval, setRefreshInterval] = useState('10000')
  // Removed local fetchError state

  useEffect(() => {
    const load = async () => {
      try {
        await refreshAll()
      } catch (err) {
        console.warn('Failed to load telemetry in background:', err)
      }
    }
    load()
    if (refreshInterval === 'manual') return
    const poll = setInterval(load, Number(refreshInterval))
    return () => clearInterval(poll)
  }, [refreshAll, refreshInterval])

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) => {
      if (prev.includes(id)) return prev.filter((d) => d !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (selectedDevices.length === 0) {
      setHistory([])
      return
    }

    const now = new Date()
    const point: any = {
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    let hasData = false
    selectedDevices.forEach((id) => {
      const tel = telemetry[id]
      if (tel?.device_type) {
        const val = getMetricValue(tel.device_type, tel)
        if (val !== null) {
          point[id] = val
          hasData = true
        }
      }
    })

    if (hasData) {
      setHistory((prev) => {
        // Prevent adding duplicate points in the same second if telemetry didn't change
        const last = prev[prev.length - 1]
        if (last && last.timestamp === point.timestamp) {
          return prev
        }
        const next = [...prev, point]
        return next.slice(-40) // Keep the last 40 data points
      })
    }
  }, [telemetry, selectedDevices])

  const DEFAULT_PALETTE = ['#0D9488', '#3B82F6', '#F59E0B']

  const [deviceColors, setDeviceColors] = useState<Record<string, string>>({})

  const getDeviceColor = (id: string, index: number) => {
    const hex = deviceColors[id] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]
    // Convert hex to rgb for the fill opacity
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { stroke: hex, fill: `rgba(${r}, ${g}, ${b}, 0.08)` }
  }

  const colors = selectedDevices.map((id, i) => getDeviceColor(id, i))

  const handleColorChange = (id: string, color: string) => {
    setDeviceColors((prev) => ({ ...prev, [id]: color }))
  }

  const getStats = (deviceId: string) => {
    const tel = telemetry[deviceId]
    if (!tel?.device_type) return { current: 0 }
    const current = getMetricValue(tel.device_type, tel) ?? 0
    return { current }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    if (selectedDevices.length === 0) {
      useToastStore.getState().showInfo('Please select at least one device to export telemetry.')
      return
    }
    try {
      for (const id of selectedDevices) {
        const blob = await exportTelemetryApi(id, format)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `export_${id}.${format}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to export telemetry data:', err)
    }
  }

  const handleManualRefresh = async () => {
    try {
      await refreshAll()
    } catch (err) {
      console.error('Failed to manually refresh telemetry:', err)
    }
  }

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Monitoring</h1>
          <p className="text-sm text-text-muted font-medium">Analyze real-time sensor streams and telemetry charts.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select options={REFRESH_OPTIONS} value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} className="w-36 h-10" />
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleManualRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="h-10 text-xs" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" className="h-10 text-xs" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4" /> JSON
          </Button>
        </div>
      </div>

      {/* Telemetry errors logged to browser logs */}

      <Card>
        <CardHeader className="p-0">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-text-muted">Overlay Telemetry Channels</CardTitle>
          <CardDescription className="text-xs font-medium text-text-muted mt-1">Select up to 3 running devices to overlay on the graph below.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4 flex flex-wrap gap-2">
          {runningDevices.length === 0 ? (
            <p className="text-sm text-text-muted font-medium">No running devices available.</p>
          ) : (
            runningDevices.map((id) => {
              const selected = selectedDevices.includes(id)
              return (
                <button
                  key={id}
                  onClick={() => toggleDevice(id)}
                  className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer min-h-[38px] ${selected
                    ? 'border-border-accent bg-accent text-white shadow-sm shadow-accent/10 hover:bg-accent-hover active:bg-accent-active'
                    : 'border-border hover:bg-bg-elevated text-text-secondary'
                    }`}
                >
                  {id}
                </button>
              )
            })
          )}
        </CardContent>
      </Card>

      {selectedDevices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedDevices.map((id, index) => {
            const stats = getStats(id)
            const color = colors[index]
            return (
              <Card key={id} className="border-l-4" style={{ borderLeftColor: color.stroke }}>
                <CardHeader className="p-0 pb-1.5 flex flex-row items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted truncate">{id}</span>
                  <div className="flex items-center gap-2">
                    <label className="relative cursor-pointer group" title="Change graph color">
                      <Palette className="h-3.5 w-3.5 text-text-muted group-hover:text-text-primary transition-colors" />
                      <input
                        type="color"
                        value={color.stroke}
                        onChange={(e) => handleColorChange(id, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                    <div
                      className="h-3 w-3 rounded-full ring-2 ring-white/20 shadow-sm cursor-pointer relative overflow-hidden"
                      style={{ backgroundColor: color.stroke }}
                      title="Click to change color"
                    >
                      <input
                        type="color"
                        value={color.stroke}
                        onChange={(e) => handleColorChange(id, e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-3xl font-bold tracking-tight text-text-primary">
                    {stats.current.toFixed(1)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-6">
        {selectedDevices.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center text-text-muted gap-3">
            <Layers className="h-10 w-10 text-text-muted" />
            <p className="text-sm font-semibold tracking-wide">Select devices above to visualize live graph feeds.</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <Suspense fallback={
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              </div>
            }>
              <TelemetryChart chartData={history} selectedDevices={selectedDevices} colors={colors} />
            </Suspense>
          </div>
        )}
      </Card>
    </div>
  )
}
