import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useDeviceStore } from '@/store/deviceStore'
import {
  SIMULATOR_DEVICE_TYPE_OPTIONS,
  SIMULATOR_DEVICE_TYPE_LABELS,
  formatSimulatorTimestamp,
} from '@/utils/simulatorDevices'
import type { SimulatorDeviceType } from '@/types'
import { cn } from '@/utils/cn'

function DeviceMetrics({ deviceType, telemetry }: {
  deviceType: SimulatorDeviceType
  telemetry: { temperature?: number; battery?: number; volume?: number; brightness?: number; fps?: number }
}) {
  return (
    <div className="mt-4 space-y-1.5 text-sm">
      {deviceType === 'temperature_sensor' && (
        <>
          {telemetry.temperature != null && (
            <p>
              <span className="text-text-muted">Temperature:</span>{' '}
              <span className="font-semibold">{telemetry.temperature}°C</span>
            </p>
          )}
          {telemetry.battery != null && (
            <p>
              <span className="text-text-muted">Battery:</span>{' '}
              <span className="font-semibold">{telemetry.battery}%</span>
            </p>
          )}
        </>
      )}
      {deviceType === 'speaker' && (
        <>
          {telemetry.volume != null && (
            <p>
              <span className="text-text-muted">Volume:</span>{' '}
              <span className="font-semibold">{telemetry.volume}</span>
            </p>
          )}
          {telemetry.battery != null && (
            <p>
              <span className="text-text-muted">Battery:</span>{' '}
              <span className="font-semibold">{telemetry.battery}%</span>
            </p>
          )}
        </>
      )}
      {deviceType === 'camera' && (
        <>
          {telemetry.fps != null && (
            <p>
              <span className="text-text-muted">FPS:</span>{' '}
              <span className="font-semibold">{telemetry.fps}</span>
            </p>
          )}
          {telemetry.battery != null && (
            <p>
              <span className="text-text-muted">Battery:</span>{' '}
              <span className="font-semibold">{telemetry.battery}%</span>
            </p>
          )}
        </>
      )}
      {deviceType === 'microphone' && telemetry.battery != null && (
        <p>
          <span className="text-text-muted">Battery:</span>{' '}
          <span className="font-semibold">{telemetry.battery}%</span>
        </p>
      )}
      {deviceType === 'projector' && (
        <>
          {telemetry.brightness != null && (
            <p>
              <span className="text-text-muted">Brightness:</span>{' '}
              <span className="font-semibold">{telemetry.brightness}</span>
            </p>
          )}
          {telemetry.battery != null && (
            <p>
              <span className="text-text-muted">Battery:</span>{' '}
              <span className="font-semibold">{telemetry.battery}%</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}

export function DevicesPage() {
  const [searchParams] = useSearchParams()
  const runningDevices = useDeviceStore((s) => s.runningDevices)
  const telemetry = useDeviceStore((s) => s.telemetry)
  const loading = useDeviceStore((s) => s.loading)
  const refreshAll = useDeviceStore((s) => s.refreshAll)
  const startSimulation = useDeviceStore((s) => s.startSimulation)
  const stopSimulation = useDeviceStore((s) => s.stopSimulation)

  const [showAdd, setShowAdd] = useState(searchParams.get('add') === 'true')
  const [deviceId, setDeviceId] = useState('')
  const [deviceType, setDeviceType] = useState<SimulatorDeviceType | ''>('')
  const [intervalSeconds, setIntervalSeconds] = useState(5)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [fetchError, setFetchError] = useState('')
  const [addError, setAddError] = useState('')
  const [stopError, setStopError] = useState('')
  const [adding, setAdding] = useState(false)
  const [stoppingId, setStoppingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        await refreshAll()
        setFetchError('')
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load running devices')
      }
    }
    load()
    const poll = setInterval(load, 10000)
    return () => clearInterval(poll)
  }, [refreshAll])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!deviceId.trim()) errors.deviceId = 'Device ID is required.'
    if (!deviceType) errors.deviceType = 'Device type is required.'
    if (!intervalSeconds || intervalSeconds < 1) errors.interval = 'Interval must be at least 1 second.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdd = async () => {
    setAddError('')
    if (!validate()) return

    setAdding(true)
    try {
      await startSimulation({
        device_id: deviceId.trim(),
        device_type: deviceType as SimulatorDeviceType,
        interval: intervalSeconds,
      })
      setShowAdd(false)
      setDeviceId('')
      setDeviceType('')
      setIntervalSeconds(5)
      setFieldErrors({})
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add device.')
    } finally {
      setAdding(false)
    }
  }

  const handleStop = async (id: string) => {
    setStopError('')
    setStoppingId(id)
    try {
      await stopSimulation(id)
    } catch (err) {
      setStopError(err instanceof Error ? err.message : 'Failed to stop simulation')
    } finally {
      setStoppingId(null)
    }
  }

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Devices</h1>
          <p className="text-sm text-text-muted font-medium">
            Manage running device simulations and live telemetry.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-10 text-xs">
          <Plus className="h-4 w-4" /> Add Device
        </Button>
      </div>

      {fetchError && (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 border border-red-200">
          {fetchError}
        </div>
      )}

      {stopError && (
        <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 border border-red-200">
          {stopError}
        </div>
      )}

      {loading && runningDevices.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : runningDevices.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-text-muted font-medium">
            No devices running. Add a device above to get started.
          </p>
          <Button onClick={() => setShowAdd(true)} className="mt-6 h-10 text-xs">
            <Plus className="h-4 w-4" /> Add Device
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {runningDevices.map((id) => {
            const tel = telemetry[id]
            const type = tel?.device_type

            return (
              <Card key={id} className="rounded-xl bg-white p-5 shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Device ID
                    </p>
                    <p className="font-bold text-text-primary mt-0.5">{id}</p>
                  </div>
                  {type && (
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent shrink-0">
                      {SIMULATOR_DEVICE_TYPE_LABELS[type]}
                    </span>
                  )}
                </div>

                {tel?.timestamp && (
                  <p className="mt-3 text-xs text-text-muted">
                    {formatSimulatorTimestamp(tel.timestamp)}
                  </p>
                )}

                {type && tel && <DeviceMetrics deviceType={type} telemetry={tel} />}

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    className="h-9 text-xs"
                    loading={stoppingId === id}
                    onClick={() => handleStop(id)}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Device">
        {addError && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 border border-red-200">
            {addError}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Input
              label="Device ID"
              placeholder="e.g. sensor-001"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className={cn(fieldErrors.deviceId && 'border-red-400')}
            />
            {fieldErrors.deviceId && (
              <p className="text-xs text-red-600">{fieldErrors.deviceId}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Select
              label="Device Type"
              options={[{ value: '', label: 'Select device type…' }, ...SIMULATOR_DEVICE_TYPE_OPTIONS]}
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as SimulatorDeviceType | '')}
              className={cn(fieldErrors.deviceType && 'border-red-400')}
            />
            {fieldErrors.deviceType && (
              <p className="text-xs text-red-600">{fieldErrors.deviceType}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Input
              label="Interval (seconds)"
              type="number"
              min={1}
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              className={cn(fieldErrors.interval && 'border-red-400')}
            />
            {fieldErrors.interval && (
              <p className="text-xs text-red-600">{fieldErrors.interval}</p>
            )}
          </div>
          <div className="flex gap-3 pt-3">
            <Button variant="outline" type="button" className="flex-1 h-10 text-xs" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="button" className="flex-1 h-10 text-xs" loading={adding} onClick={handleAdd}>
              Add Device
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
