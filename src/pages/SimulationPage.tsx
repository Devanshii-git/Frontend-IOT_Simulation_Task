import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TELEMETRY_BASE_URL } from '@/config/api'
import { httpClient } from '@/services/httpClient'
import { useDeviceStore } from '@/store/deviceStore'
import {
  SIMULATOR_DEVICE_TYPE_LABELS,
  formatSimulatorTimestamp,
  getPrimaryMetricKey,
} from '@/utils/simulatorDevices'
import type { LatestTelemetry } from '@/types'
import { cn } from '@/utils/cn'

type TimeRange = '-30m' | '-1h' | '-24h'

interface HistoryPoint {
  timestamp: string
  temperature?: number
  battery?: number
  volume?: number
  brightness?: number
  fps?: number
  chartTimestamp?: string
}

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: 'Last 30 min', value: '-30m' },
  { label: 'Last 1 hour', value: '-1h' },
  { label: 'Last 24 hours', value: '-24h' },
]

function getMetricLabel(key: string): string {
  switch (key) {
    case 'temperature':
      return 'Temperature (°C)'
    case 'volume':
      return 'Volume'
    case 'fps':
      return 'FPS'
    case 'brightness':
      return 'Brightness'
    case 'battery':
      return 'Battery (%)'
    default:
      return key
  }
}

function formatChartTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

function DeviceMetrics({ telemetry }: {
  telemetry: LatestTelemetry
}) {
  const ignoreKeys = ['device_id', 'device_type', 'timestamp']
  const metrics = Object.entries(telemetry).filter(([k, v]) => !ignoreKeys.includes(k) && (typeof v === 'number' || typeof v === 'string'))

  return (
    <div className="mt-4 space-y-1.5 text-sm">
      {metrics.map(([key, value]) => {
        let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
        let formattedValue = typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value
        
        if (key === 'temperature') {
          formattedValue = `${formattedValue}°C`
        } else if (key === 'battery' || key === 'volume' || key === 'audio_level') {
          formattedValue = `${formattedValue}%`
        }

        return (
          <p key={key}>
            <span className="text-text-muted">{label}:</span>{' '}
            <span className="font-semibold">{formattedValue}</span>
          </p>
        )
      })}
    </div>
  )
}

export function SimulationPage() {
  const runningDevices = useDeviceStore((s) => s.runningDevices)
  const telemetry = useDeviceStore((s) => s.telemetry)
  const refreshAll = useDeviceStore((s) => s.refreshAll)
  const stopSimulation = useDeviceStore((s) => s.stopSimulation)

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('-30m')
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([])
  // Removed runningError, historyError, stopError states
  const [stoppingId, setStoppingId] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let isMounted = true

    const load = async () => {
      try {
        await refreshAll()
      } catch (err) {
        console.warn('Failed to load running simulations in background:', err)
      }
      
      if (isMounted) {
        timeoutId = setTimeout(load, 15000)
      }
    }
    
    load()
    
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [refreshAll])

  const fetchHistory = useCallback(async (deviceId: string, range: TimeRange) => {
    setHistoryLoading(true)
    try {
      const res = await httpClient.get(`${TELEMETRY_BASE_URL}/telemetry/${deviceId}?time_range=${range}`)
      const data = res.data
      const points: HistoryPoint[] = Array.isArray(data) ? data : (data.data ?? [])
      setHistoryData(points.map((p) => ({ ...p, chartTimestamp: formatChartTimestamp(p.timestamp) })))
    } catch (err) {
      console.error('Failed to load telemetry history:', err)
      setHistoryData([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedDeviceId) {
      setHistoryData([])
      return
    }

    let timeoutId: ReturnType<typeof setTimeout>
    let isMounted = true

    const loadHistory = async () => {
      await fetchHistory(selectedDeviceId, timeRange)
      if (isMounted) {
        timeoutId = setTimeout(loadHistory, 15000)
      }
    }

    loadHistory()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [selectedDeviceId, timeRange, fetchHistory])

  const handleStop = async (deviceId: string) => {
    setStoppingId(deviceId)
    try {
      await stopSimulation(deviceId)
      if (selectedDeviceId === deviceId) setSelectedDeviceId(null)
    } catch (err) {
      console.error('Failed to stop simulation:', err)
    } finally {
      setStoppingId(null)
    }
  }

  const selectedTelemetry = selectedDeviceId ? telemetry[selectedDeviceId] : null
  const primaryMetricKey = selectedTelemetry
    ? getPrimaryMetricKey(selectedTelemetry.device_type)
    : null

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Simulation Dashboard</h1>
        <p className="text-sm text-text-muted font-medium">Monitor running device simulations and live telemetry.</p>
      </div>

      {/* Simulation load errors logged to browser logs */}

      {runningDevices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-bg-surface p-12 shadow text-center">
          <p className="text-text-muted font-medium">
            No devices running. Go to{' '}
            <Link to="/devices?add=true" className="text-accent font-semibold hover:underline">Add Device</Link>{' '}
            to start a simulation.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {runningDevices.map((deviceId) => {
            const tel = telemetry[deviceId]
            const deviceType = tel?.device_type
            const isSelected = selectedDeviceId === deviceId

            return (
              <div
                key={deviceId}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDeviceId(deviceId)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedDeviceId(deviceId) }}
                className={cn('rounded-xl bg-bg-surface p-5 shadow cursor-pointer transition-all', isSelected && 'ring-2 ring-accent')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Device ID</p>
                    <p className="font-bold text-text-primary mt-0.5">{deviceId}</p>
                  </div>
                  {deviceType && (
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent shrink-0">
                      {SIMULATOR_DEVICE_TYPE_LABELS[deviceType]}
                    </span>
                  )}
                </div>
                {tel?.timestamp && (
                  <p className="mt-3 text-xs text-text-muted">{formatSimulatorTimestamp(tel.timestamp)}</p>
                )}
                {deviceType && tel && <DeviceMetrics telemetry={tel} />}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleStop(deviceId) }}
                  disabled={stoppingId === deviceId}
                  className="mt-4 w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {stoppingId === deviceId ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Stopping…
                    </span>
                  ) : 'Stop'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {selectedDeviceId && (
        <div className="rounded-xl bg-bg-surface p-6 shadow space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-text-primary">Telemetry — {selectedDeviceId}</h2>
            <div className="flex flex-wrap gap-2">
              {TIME_RANGES.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimeRange(value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    timeRange === value ? 'bg-accent text-white' : 'bg-bg-elevated text-text-muted hover:text-text-primary',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {/* Telemetry history errors logged to browser logs */}
          {historyLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-text-muted">Loading chart…</div>
          ) : historyData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-text-muted">No telemetry data for this time range.</div>
          ) : primaryMetricKey ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="chartTimestamp" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                    label={{ value: getMetricLabel(primaryMetricKey), angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }}
                  />
                  <Tooltip
                    labelFormatter={(_, payload) => {
                      const ts = payload?.[0]?.payload?.timestamp
                      return ts ? formatSimulatorTimestamp(String(ts)) : ''
                    }}
                  />
                  <Line type="monotone" dataKey={primaryMetricKey} stroke="#0D9488" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
