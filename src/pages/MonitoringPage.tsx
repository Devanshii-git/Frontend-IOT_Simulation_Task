import { useEffect, useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Download, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
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
    return () => { /* keep simulation running globally */ }
  }, [fetchDevices, start, config.running])

  useEffect(() => {
    telemetryWs.connect()
    const unsubs: (() => void)[] = []
    selectedDevices.forEach((id) => {
      telemetryWs.send({ action: 'subscribe', deviceId: id })
      const unsub = telemetryWs.onMessage(id, (data) => {
        setLiveData((prev) => {
          const buf = [...(prev[id] ?? []), { timestamp: data.timestamp, value: data.value }].slice(-30)
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
      const point: Record<string, string | number> = { timestamp: new Date(ts).toLocaleTimeString() }
      selectedDevices.forEach((id) => {
        const match = allPoints.find((p) => p.timestamp === ts && (p as { deviceId: string }).deviceId === id)
        if (match) point[id] = match.value
      })
      return point
    })
  }, [selectedDevices, liveData, telemetryBuffers])

  const colors = ['#3b82f6', '#10b981', '#f59e0b']

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoring</h1>
          <p className="text-sm text-slate-500">Real-time telemetry streams</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select options={REFRESH_OPTIONS} value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)} className="w-36" />
          <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="h-11 rounded-lg border border-border-light px-3 text-sm dark:border-border-dark dark:bg-slate-800" />
          <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="h-11 rounded-lg border border-border-light px-3 text-sm dark:border-border-dark dark:bg-slate-800" />
          <Button variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => handleExport('csv')}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={() => handleExport('json')}><Download className="h-4 w-4" /> JSON</Button>
        </div>
      </div>

      <Card>
        <p className="mb-3 text-sm font-medium">Select up to 3 devices to overlay</p>
        <div className="flex flex-wrap gap-2">
          {onlineDevices.map((d) => (
            <button
              key={d.id}
              onClick={() => toggleDevice(d.id)}
              className={`rounded-lg border px-3 py-2 text-sm min-h-[44px] transition-colors ${
                selectedDevices.includes(d.id)
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30'
                  : 'border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </Card>

      {selectedDevices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedDevices.map((id) => {
            const device = devices.find((d) => d.id === id)
            const stats = getStats(id)
            return (
              <Card key={id}>
                <p className="text-sm text-slate-500">{device?.name}</p>
                <p className="text-3xl font-bold">{stats.current.toFixed(1)}</p>
                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                  <span>Min: {stats.min.toFixed(1)}</span>
                  <span>Max: {stats.max.toFixed(1)}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="h-80">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">Select devices to view live data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {selectedDevices.map((id, i) => {
                const device = devices.find((d) => d.id === id)
                return <Line key={id} type="monotone" dataKey={id} name={device?.name} stroke={colors[i]} dot={false} strokeWidth={2} />
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
