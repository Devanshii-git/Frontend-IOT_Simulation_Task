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
import { useDeviceStore } from '@/store/deviceStore'
import {
  SIMULATOR_DEVICE_TYPE_LABELS,
  formatSimulatorTimestamp,
  getPrimaryMetricKey,
} from '@/utils/simulatorDevices'
import type { LatestTelemetry, SimulatorDeviceType } from '@/types'
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

function DeviceMetrics({ deviceType, telemetry }: {
  deviceType: SimulatorDeviceType
  telemetry: LatestTelemetry
}) {
  return (
    <div className="mt-4 space-y-1.5 text-sm">
      {deviceType === 'temperature_sensor' && (
        <>
          {telemetry.temperature != null && (
            <p><span className="text-text-muted">Temperature:</span> <span className="font-semibold">{telemetry.temperature}°C</span></p>
          )}
          {telemetry.battery != null && (
            <p><span className="text-text-muted">Battery:</span> <span className="font-semibold">{telemetry.battery}%</span></p>
          )}
        </>
      )}
      {deviceType === 'speaker' && (
        <>
          {telemetry.volume != null && (
            <p><span className="text-text-muted">Volume:</span> <span className="font-semibold">{telemetry.volume}</span></p>
          )}
          {telemetry.battery != null && (
            <p><span className="text-text-muted">Battery:</span> <span className="font-semibold">{telemetry.battery}%</span></p>
          )}
        </>
      )}
      {deviceType === 'camera' && (
        <>
          {telemetry.fps != null && (
            <p><span className="text-text-muted">FPS:</span> <span className="font-semibold">{telemetry.fps}</span></p>
          )}
          {telemetry.battery != null && (
            <p><span className="text-text-muted">Battery:</span> <span className="font-semibold">{telemetry.battery}%</span></p>
          )}
        </>
      )}
      {deviceType === 'microphone' && telemetry.battery != null && (
        <p><span className="text-text-muted">Battery:</span> <span className="font-semibold">{telemetry.battery}%</span></p>
      )}
      {deviceType === 'projector' && (
        <>
          {telemetry.brightness != null && (
            <p><span className="text-text-muted">Brightness:</span> <span className="font-semibold">{telemetry.brightness}</span></p>
          )}
          {telemetry.battery != null && (
            <p><span className="text-text-muted">Battery:</span> <span className="font-semibold">{telemetry.battery}%</span></p>
          )}
        </>
      )}
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
  const [runningError, setRunningError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [stopError, setStopError] = useState('')
  const [stoppingId, setStoppingId] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        await refreshAll()
        setRunningError('')
      } catch (err) {
        setRunningError(err instanceof Error ? err.message : 'Failed to load running simulations')
      }
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [refreshAll])

  const fetchHistory = useCallback(async (deviceId: string, range: TimeRange) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`${TELEMETRY_BASE_URL}/telemetry/${deviceId}?time_range=${range}`)
      if (!res.ok) throw new Error('Failed to fetch telemetry history')
      const data = await res.json()
      const points: HistoryPoint[] = Array.isArray(data) ? data : (data.data ?? [])
      setHistoryData(points.map((p) => ({ ...p, chartTimestamp: formatChartTimestamp(p.timestamp) })))
      setHistoryError('')
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load telemetry history')
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
    fetchHistory(selectedDeviceId, timeRange)
  }, [selectedDeviceId, timeRange, fetchHistory])

  const handleStop = async (deviceId: string) => {
    setStopError('')
    setStoppingId(deviceId)
    try {
      await stopSimulation(deviceId)
      if (selectedDeviceId === deviceId) setSelectedDeviceId(null)
    } catch (err) {
      setStopError(err instanceof Error ? err.message : 'Failed to stop simulation')
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

      {runningError && (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 border border-red-200">{runningError}</div>
      )}
      {stopError && (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 border border-red-200">{stopError}</div>
      )}

      {runningDevices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow text-center">
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
                className={cn('rounded-xl bg-white p-5 shadow cursor-pointer transition-all', isSelected && 'ring-2 ring-accent')}
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
                {deviceType && tel && <DeviceMetrics deviceType={deviceType} telemetry={tel} />}
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
        <div className="rounded-xl bg-white p-6 shadow space-y-4">
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
          {historyError && (
            <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 border border-red-200">{historyError}</div>
          )}
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
