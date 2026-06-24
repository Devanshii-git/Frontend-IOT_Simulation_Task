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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Devices</h1>
          <p className="text-sm text-slate-500">{filtered.length} of {devices.length} devices</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Device</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search devices..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="h-11 w-full rounded-lg border border-border-light bg-white pl-10 pr-4 text-sm dark:border-border-dark dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <Select
          options={[{ value: 'all', label: 'All Types' }, ...deviceTypeOptions]}
          value={filters.type}
          onChange={(e) => setFilters({ type: e.target.value as DeviceType | 'all' })}
          className="sm:w-40"
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
          className="sm:w-36"
        />
        <Select
          options={[{ value: '', label: 'All Locations' }, ...locations.map((l) => ({ value: l, label: l }))]}
          value={filters.location}
          onChange={(e) => setFilters({ location: e.target.value })}
          className="sm:w-36"
        />
        <div className="flex gap-1">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('grid')}><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center py-12 text-center">
          <Search className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 font-semibold">No devices found</h3>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or add a new device</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            <Button onClick={() => setShowAdd(true)}>Add Device</Button>
          </div>
        </Card>
      ) : (
        <div className={cn(view === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3')}>
          {filtered.map((device) => {
            const cfg = deviceTypeConfig[device.type]
            const Icon = cfg.icon
            return (
              <Card key={device.id} className={cn(view === 'list' && 'flex items-center gap-4')}>
                <div className={cn('flex items-start gap-3', view === 'list' && 'flex-1')}>
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', cfg.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{device.name}</h3>
                      <StatusPill status={device.status} />
                    </div>
                    <p className="text-xs text-slate-500">{device.location} · {device.protocol}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <SignalStrength strength={device.signalStrength} />
                      <span>{formatRelativeTime(device.lastPing)}</span>
                    </div>
                  </div>
                </div>
                <div className={cn('flex items-center gap-2', view === 'grid' ? 'mt-3 justify-between border-t border-border-light pt-3 dark:border-border-dark' : '')}>
                  <Switch checked={device.isToggledOn} onChange={(v) => toggleDevice(device.id, v)} label={device.isToggledOn ? 'ON' : 'OFF'} />
                  <Button variant="ghost" size="icon" onClick={() => deleteDevice(device.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Device">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Device Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Type" options={deviceTypeOptions} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DeviceType })} />
          <Input label="Location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input label="IP / Device ID" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} placeholder="192.168.1.x" />
          <Select label="Protocol" options={protocolOptions} value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value as DeviceProtocol })} />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={adding}>Add Device</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
