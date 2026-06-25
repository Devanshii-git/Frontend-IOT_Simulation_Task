import { useEffect, useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Download, RefreshCw, Layers } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useDeviceStore } from '@/store/deviceStore'
import { useSimulationStore } from '@/store/simulationStore'
import { telemetryWs } from '@/services/websocket'
import { exportToCSV, exportToJSON } from '@/utils/export'
import type { TelemetryPoint } from '@/types'

const REFRESH_OPTIONS = [
  { value: '5000', label: '5 seconds' },
  { value: '10000', label: '10 seconds' },
  { value: '30000', label: '30 seconds' },
  { value: 'manual', label: 'Manual' },
]

export function MonitoringPage() {
  const { devices, fetchDevices } = useDeviceStore()
  const { start, config, telemetryBuffers } = useSimulationStore()
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [refreshInterval, setRefreshInterval] = useState('10000')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [liveData, setLiveData] = useState<Record<string, TelemetryPoint[]>>({})

  useEffect(() => {
    fetchDevices()
    if (!config.running) start()
  }, [fetchDevices, start, config.running])

  useEffect(() => {
    telemetryWs.connect()
    const unsubs: (() => void)[] = []
    selectedDevices.forEach((id) => {
      telemetryWs.send({ action: 'subscribe', deviceId: id })
      const unsub = telemetryWs.onMessage(id, (data) => {
        setLiveData((prev) => {
          const buf = [...(prev[id] ?? []), { timestamp: data.timestamp, value: data.value }].slice(-35)
          return { ...prev, [id]: buf }
        })
      })
      unsubs.push(unsub)
    })
    return () => {
      selectedDevices.forEach((id) => telemetryWs.send({ action: 'unsubscribe', deviceId: id }))
      unsubs.forEach((u) => u())
    }
  }, [selectedDevices])

  const onlineDevices = devices.filter((d) => d.status !== 'offline')

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) => {
      if (prev.includes(id)) return prev.filter((d) => d !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const chartData = useMemo(() => {
    if (selectedDevices.length === 0) return []
    const allPoints = selectedDevices.flatMap((id) => {
      const buf = liveData[id]?.length ? liveData[id] : telemetryBuffers[id] ?? []
      return buf.map((p) => ({ ...p, deviceId: id }))
    })
    const timestamps = [...new Set(allPoints.map((p) => p.timestamp))].sort()
    return timestamps.map((ts) => {
      const point: Record<string, string | number> = { timestamp: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
      selectedDevices.forEach((id) => {
        const match = allPoints.find((p) => p.timestamp === ts && (p as { deviceId: string }).deviceId === id)
        if (match) point[id] = match.value
      })
      return point
    })
  }, [selectedDevices, liveData, telemetryBuffers])

  const colors = [
    { stroke: '#0D9488', fill: 'rgba(13, 148, 136, 0.05)' },
    { stroke: '#0F766E', fill: 'rgba(15, 118, 110, 0.05)' },
    { stroke: '#115E59', fill: 'rgba(17, 94, 89, 0.05)' },
  ]

  const getStats = (deviceId: string) => {
    const data = liveData[deviceId] ?? telemetryBuffers[deviceId] ?? []
    if (!data.length) return { current: 0, min: 0, max: 0 }
    const values = data.map((d) => d.value).filter((v) => !isNaN(v))
    return {
      current: values[values.length - 1] ?? 0,
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  const handleExport = (format: 'csv' | 'json') => {
    const data = selectedDevices.flatMap((id) => liveData[id] ?? telemetryBuffers[id] ?? [])
    if (format === 'csv') exportToCSV(data, 'telemetry-export')
    else exportToJSON(data, 'telemetry-export')
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
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="h-10 rounded-md border border-border px-3 text-xs font-semibold uppercase tracking-wider bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle/40 focus:border-border-accent"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="h-10 rounded-md border border-border px-3 text-xs font-semibold uppercase tracking-wider bg-bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle/40 focus:border-border-accent"
          />
          <Button variant="outline" size="icon" className="h-10 w-10">
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

      {/* Select Overlay sensors card */}
      <Card>
        <CardHeader className="p-0">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-text-muted">Overlay Telemetry Channels</CardTitle>
          <CardDescription className="text-xs font-medium text-text-muted mt-1">Select up to 3 active devices to overlay on the graph below.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4 flex flex-wrap gap-2">
          {onlineDevices.map((d) => {
            const selected = selectedDevices.includes(d.id)
            return (
              <button
                key={d.id}
                onClick={() => toggleDevice(d.id)}
                className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
                  selected
                    ? 'border-border-accent bg-accent text-white shadow-sm shadow-accent/10 hover:bg-accent-hover active:bg-accent-active'
                    : 'border-border hover:bg-bg-elevated text-text-secondary'
                }`}
              >
                {d.name}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Device statistics cards */}
      {selectedDevices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedDevices.map((id, index) => {
            const device = devices.find((d) => d.id === id)
            const stats = getStats(id)
            return (
              <Card key={id} className="border-l-4" style={{ borderLeftColor: colors[index].stroke }}>
                <CardHeader className="p-0 pb-1.5 flex flex-row items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted truncate">{device?.name}</span>
                  <div className="h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: colors[index].stroke }} />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-3xl font-bold tracking-tight text-text-primary">
                    {stats.current.toFixed(1)}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs font-bold text-text-muted">
                    <span>Min: {stats.min.toFixed(1)}</span>
                    <span>Max: {stats.max.toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Telemetry charts Area */}
      <Card className="p-6">
        {chartData.length === 0 ? (
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
                    fontFamily: 'monospace'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', marginTop: '10px' }} />
                {selectedDevices.map((id, i) => {
                  const device = devices.find((d) => d.id === id)
                  return (
                    <Area
                      key={id}
                      type="monotone"
                      dataKey={id}
                      name={device?.name}
                      stroke={colors[i].stroke}
                      fill={`url(#grad-${id})`}
                      strokeWidth={2}
                      activeDot={{ r: 4 }}
                    />
                  )
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
