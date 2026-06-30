import { useEffect, useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Download, RefreshCw, Layers } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useDeviceStore } from '@/store/deviceStore'
import { getPrimaryMetricKey } from '@/utils/simulatorDevices'
import { exportToCSV, exportToJSON } from '@/utils/export'
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
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        await refreshAll()
        setFetchError('')
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load telemetry')
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

  const chartData = useMemo(() => {
    return selectedDevices.map((id) => {
      const tel = telemetry[id]
      const value = tel?.device_type ? getMetricValue(tel.device_type, tel) : null
      return {
        timestamp: tel?.timestamp
          ? new Date(tel.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : id,
        [id]: value ?? 0,
      }
    })
  }, [selectedDevices, telemetry])

  const colors = [
    { stroke: '#0D9488', fill: 'rgba(13, 148, 136, 0.05)' },
    { stroke: '#0F766E', fill: 'rgba(15, 118, 110, 0.05)' },
    { stroke: '#115E59', fill: 'rgba(17, 94, 89, 0.05)' },
  ]

  const getStats = (deviceId: string) => {
    const tel = telemetry[deviceId]
    if (!tel?.device_type) return { current: 0 }
    const current = getMetricValue(tel.device_type, tel) ?? 0
    return { current }
  }

  const handleExport = (format: 'csv' | 'json') => {
    const data = selectedDevices
      .map((id) => telemetry[id])
      .filter(Boolean)
      .map((tel) => ({
        timestamp: tel!.timestamp,
        device_id: tel!.device_id,
        value: tel!.device_type ? (getMetricValue(tel!.device_type, tel!) ?? 0) : 0,
      }))
    if (format === 'csv') exportToCSV(data, 'telemetry-export')
    else exportToJSON(data, 'telemetry-export')
  }

  const handleManualRefresh = async () => {
    try {
      await refreshAll()
      setFetchError('')
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to refresh telemetry')
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

      {fetchError && (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 border border-red-200">
          {fetchError}
        </div>
      )}

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
                  className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
                    selected
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
            return (
              <Card key={id} className="border-l-4" style={{ borderLeftColor: colors[index].stroke }}>
                <CardHeader className="p-0 pb-1.5 flex flex-row items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted truncate">{id}</span>
                  <div className="h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: colors[index].stroke }} />
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {selectedDevices.map((id, i) => (
                    <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[i].stroke} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={colors[i].stroke} stopOpacity={0.01}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 'bold' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 'bold' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', marginTop: '10px' }} />
                {selectedDevices.map((id, i) => (
                  <Area
                    key={id}
                    type="monotone"
                    dataKey={id}
                    name={id}
                    stroke={colors[i].stroke}
                    fill={`url(#grad-${id})`}
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
