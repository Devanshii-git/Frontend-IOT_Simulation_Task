import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusPill } from '@/components/ui/StatusPill'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { SignalStrength } from '@/components/ui/SignalStrength'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useDeviceStore } from '@/store/deviceStore'
import { deviceTypeConfig, deviceTypeOptions, protocolOptions } from '@/utils/deviceIcons'
import { formatRelativeTime } from '@/utils/format'
import type { DeviceType, DeviceProtocol } from '@/types'
import { cn } from '@/utils/cn'

export function DevicesPage() {
  const [searchParams] = useSearchParams()
  const { devices, loading, fetchDevices, addDevice, toggleDevice, deleteDevice, filters, setFilters, clearFilters, getFilteredDevices } = useDeviceStore()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showAdd, setShowAdd] = useState(searchParams.get('add') === 'true')
  const [form, setForm] = useState({ name: '', type: 'temperature' as DeviceType, location: '', ipAddress: '', protocol: 'MQTT' as DeviceProtocol })
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchDevices() }, [fetchDevices])

  const filtered = getFilteredDevices()
  const locations = [...new Set(devices.map((d) => d.location))]

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      await addDevice(form)
      setShowAdd(false)
      setForm({ name: '', type: 'temperature', location: '', ipAddress: '', protocol: 'MQTT' })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Devices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage and configure your active and simulated sensors.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-10 text-xs">
          <Plus className="h-4 w-4" /> Add Device
        </Button>
      </div>

      {/* Filter and View Controls bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            placeholder="Search devices..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 placeholder:text-slate-400 transition-all"
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
          <div className="flex gap-1 border border-slate-200 dark:border-slate-800 rounded-md p-1 bg-slate-50 dark:bg-slate-900 h-10">
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 min-h-[32px] min-w-[32px]" onClick={() => setView('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 min-h-[32px] min-w-[32px]" onClick={() => setView('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-bold text-slate-800 dark:text-white">No devices found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">Try adjusting your filters or add a new device.</p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="h-10 text-xs" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button onClick={() => setShowAdd(true)} className="h-10 text-xs">
              Add Device
            </Button>
          </div>
        </Card>
      ) : (
        <div className={cn(view === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3')}>
          {filtered.map((device) => {
            const cfg = deviceTypeConfig[device.type]
            const Icon = cfg.icon
            return (
              <Card key={device.id} className={cn(view === 'list' && 'flex items-center gap-4 py-3')}>
                <div className={cn('flex items-start gap-4.5', view === 'list' && 'flex-1')}>
                  {/* Category icon */}
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', cfg.color)}>
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 dark:text-slate-50 truncate">{device.name}</h3>
                      <StatusPill status={device.status} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                      {device.location} &bull; {device.protocol}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <SignalStrength strength={device.signalStrength} />
                      <span className="text-[11px] text-slate-400">{formatRelativeTime(device.lastPing)}</span>
                    </div>
                  </div>
                </div>

                {/* Status toggles & actions */}
                <div className={cn(
                  'flex items-center gap-4',
                  view === 'grid'
                    ? 'mt-4 justify-between border-t border-slate-100 dark:border-slate-800 pt-3'
                    : 'shrink-0'
                )}>
                  <Switch
                    checked={device.isToggledOn}
                    onChange={(v) => toggleDevice(device.id, v)}
                    label={device.isToggledOn ? 'ACTIVE' : 'STANDBY'}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
                    onClick={() => deleteDevice(device.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Device modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Device">
        <form onSubmit={handleAdd} className="space-y-4">
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
            label="IP Address or Unique ID"
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
            <Button variant="outline" type="button" className="flex-1 h-10 text-xs" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-10 text-xs" loading={adding}>
              Add Device
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
