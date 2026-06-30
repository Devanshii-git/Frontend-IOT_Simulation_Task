import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Search, LayoutGrid, List as ListIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useDeviceStore } from '@/store/deviceStore'
import { StatusPill } from '@/components/ui/StatusPill'
import { SignalStrength } from '@/components/ui/SignalStrength'
import type { DeviceType, DeviceProtocol } from '@/types'
import { cn } from '@/utils/cn'
import { deviceTypeConfig, deviceTypeOptions, protocolOptions } from '@/utils/deviceIcons'
import { formatRelativeTime } from '@/utils/format'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { SpotlightCard } from '@/components/ui/SpotlightCard'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 110,
      damping: 14,
    },
  },
}

export function DevicesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const {
    devices,
    loading,
    filters,
    fetchDevices,
    addDevice,
    toggleDevice,
    deleteDevice,
    setFilters,
    clearFilters,
    getFilteredDevices,
  } = useDeviceStore()

  const [showAdd, setShowAdd] = useState(searchParams.get('add') === 'true')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  
  const [form, setForm] = useState({
    name: '',
    type: 'temperature' as DeviceType,
    location: '',
    ipAddress: '',
    protocol: 'MQTT' as DeviceProtocol,
  })

  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchDevices().catch((e) => console.error(e))
  }, [fetchDevices])

  const filtered = useMemo(() => {
    void devices
    void filters
    return getFilteredDevices()
  }, [getFilteredDevices, devices, filters])

  // Extract unique locations for filtering
  const locations = useMemo(() => {
    const set = new Set<string>()
    for (const d of devices) {
      if (d.location) set.add(d.location)
    }
    return Array.from(set)
  }, [devices])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    if (!form.name.trim() || !form.location.trim()) {
      setErrorMessage('Device Name and Location are required.')
      return
    }
    setAdding(true)
    try {
      await addDevice(form)
      setShowAdd(false)
      setForm({
        name: '',
        type: 'temperature',
        location: '',
        ipAddress: '',
        protocol: 'MQTT',
      })
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add device.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this device?')) return
    setDeletingId(id)
    try {
      await deleteDevice(id)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete device')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggle = async (id: string, checked: boolean) => {
    try {
      await toggleDevice(id, checked)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Devices</h1>
          <p className="text-sm text-text-muted font-medium font-semibold">
            Manage your physical database sensors and simulation workflows.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-10 text-xs font-bold">
          <Plus className="h-4 w-4" /> Add Device
        </Button>
      </div>

      {/* Filter and View Controls bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
          <input
            placeholder="Search devices..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="h-10 w-full rounded-md border border-border bg-bg-surface pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle/40 focus:border-border-accent placeholder:text-text-muted transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            options={[{ value: 'all', label: 'All Types' }, ...deviceTypeOptions]}
            value={filters.type}
            onChange={(e) => setFilters({ type: e.target.value as DeviceType | 'all' })}
            className="w-36 h-10"
          />
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'online', label: 'Online' },
              { value: 'offline', label: 'Offline' },
              { value: 'warning', label: 'Warning' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as typeof filters.status })}
            className="w-32 h-10"
          />
          <Select
            options={[{ value: '', label: 'All Locations' }, ...locations.map((l) => ({ value: l, label: l }))]}
            value={filters.location}
            onChange={(e) => setFilters({ location: e.target.value })}
            className="w-36 h-10"
          />
          <div className="flex gap-1 border border-border rounded-md p-1 bg-bg-primary h-10">
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 min-h-[32px] min-w-[32px]" onClick={() => setView('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 min-h-[32px] min-w-[32px]" onClick={() => setView('list')}>
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      {loading && devices.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated text-text-muted">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-bold text-text-primary">No devices found</h3>
          <p className="mt-1 text-sm text-text-muted font-medium">Try adjusting your filters or add a new device.</p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="h-10 text-xs font-semibold" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={() => setShowAdd(true)} className="h-10 text-xs font-semibold">
              Add Device
            </Button>
          </div>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={cn(view === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3')}
        >
          {filtered.map((device) => {
            const cfg = deviceTypeConfig[device.type] || deviceTypeConfig.custom
            const Icon = cfg.icon
            return (
              <motion.div key={device.id} variants={itemVariants}>
                <SpotlightCard
                  interactive
                  onClick={() => navigate(`/devices/${device.id}`)}
                  className={cn(view === 'list' && 'flex items-center gap-4 py-3')}
                  spotlightColor="rgba(13, 148, 136, 0.15)"
                >
                  <div className={cn('flex items-start gap-4.5', view === 'list' && 'flex-1')}>
                    {/* Category icon */}
                    <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-205 dark:border-slate-800 bg-bg-elevated', cfg.color)}>
                      <Icon className="h-5.5 w-5.5" />
                    </div>
                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-text-primary truncate text-sm">{device.name}</h3>
                        <StatusPill status={device.status} />
                      </div>
                      <p className="text-xs text-text-muted font-semibold mt-1">
                        {device.location} &bull; {device.protocol}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-text-muted font-medium">
                        <SignalStrength strength={device.signalStrength} />
                        <span className="text-[10px] text-text-muted">{formatRelativeTime(device.lastPing)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status toggles & actions */}
                  <div
                    className={cn(
                      'flex items-center gap-4',
                      view === 'grid'
                        ? 'mt-4 justify-between border-t border-border pt-3'
                        : 'shrink-0'
                    )}
                    onClick={(e) => e.stopPropagation()} // Prevent card navigation when clicking actions
                  >
                    <Switch
                      checked={device.isToggledOn}
                      onChange={(v) => handleToggle(device.id, v)}
                      label={device.isToggledOn ? 'ACTIVE' : 'STANDBY'}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-status-error/10 hover:text-status-error cursor-pointer rounded-lg border border-transparent"
                      loading={deletingId === device.id}
                      onClick={(e) => handleDelete(device.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-status-error" />
                    </Button>
                  </div>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add Device modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Device">
        <form onSubmit={handleAdd} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg bg-status-error/15 border border-status-error/35 p-3 text-xs text-status-error font-medium">
              {errorMessage}
            </div>
          )}
          
          <Input
            label="Device Name"
            placeholder="e.g. Living Room Thermostat"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Type"
            options={deviceTypeOptions}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as DeviceType })}
          />
          <Input
            label="Location"
            placeholder="e.g. Building A - Floor 2"
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Input
            label="IP Address or MAC"
            value={form.ipAddress}
            onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
            placeholder="e.g. 192.168.1.45"
          />
          <Select
            label="Protocol"
            options={protocolOptions}
            value={form.protocol}
            onChange={(e) => setForm({ ...form, protocol: e.target.value as DeviceProtocol })}
          />
          
          <div className="flex gap-3 pt-3">
            <Button variant="outline" type="button" className="flex-1 h-10 text-xs font-bold" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-10 text-xs font-bold" loading={adding}>
              Add Device
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
