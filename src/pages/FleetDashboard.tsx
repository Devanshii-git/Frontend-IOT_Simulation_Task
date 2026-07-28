import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusPill } from '@/components/ui/StatusPill'
import { useDeviceStore } from '@/store/deviceStore'
import { 
  Trash2, 
  Search, 
  RefreshCw, 
  Power, 
  Layers, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Play,
  Square
} from 'lucide-react'
import { cn } from '@/utils/cn'

export function FleetDashboard() {
  const {
    devices,
    loading,
    fetchDevices,
    bulkKillDevices,
    toggleDevice
  } = useDeviceStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchDevices().catch((e) => console.error(e))
  }, [fetchDevices])

  // Filter virtual devices
  const virtualDevices = useMemo(() => {
    return devices.filter(d => 
      (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.ipAddress || '').includes(searchQuery) ||
      (d.protocol || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [devices, searchQuery])

  // Aggregate stats
  const stats = useMemo(() => {
    const total = virtualDevices.length
    const online = virtualDevices.filter(d => d.status === 'online').length
    const offline = virtualDevices.filter(d => d.status === 'offline').length
    const warning = virtualDevices.filter(d => d.status === 'warning').length
    return { total, online, offline, warning }
  }, [virtualDevices])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(virtualDevices.map(d => d.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id))
    }
  }

  const handleBulkKill = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to terminate ${selectedIds.length} virtual workers?`)) return
    setActionLoading(true)
    try {
      await bulkKillDevices(selectedIds)
      setSelectedIds([])
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkToggle = async (turnOn: boolean) => {
    if (selectedIds.length === 0) return
    setActionLoading(true)
    try {
      await Promise.all(selectedIds.map(id => toggleDevice(id, turnOn)))
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Fleet Dashboard</h1>
          <p className="text-sm text-text-muted">
            Monitor status, control listeners, and execute bulk operations across virtual simulated devices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchDevices()} disabled={loading} className="cursor-pointer min-h-[36px]">
            <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} /> Refresh status
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-bg-surface p-4 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-text-muted font-semibold uppercase">Total Fleet Size</span>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          </div>
          <div className="h-10 w-10 bg-accent/15 text-accent rounded-lg flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border border-border bg-bg-surface p-4 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-text-muted font-semibold uppercase">Workers Online</span>
            <p className="text-2xl font-bold text-status-success">{stats.online}</p>
          </div>
          <div className="h-10 w-10 bg-status-success/15 text-status-success rounded-lg flex items-center justify-center">
            <Wifi className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border border-border bg-bg-surface p-4 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-text-muted font-semibold uppercase">Workers Offline</span>
            <p className="text-2xl font-bold text-text-muted">{stats.offline}</p>
          </div>
          <div className="h-10 w-10 bg-bg-elevated text-text-muted rounded-lg flex items-center justify-center">
            <WifiOff className="h-5 w-5" />
          </div>
        </Card>

        <Card className="border border-border bg-bg-surface p-4 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-text-muted font-semibold uppercase">Alert Threshold Warnings</span>
            <p className="text-2xl font-bold text-status-warning">{stats.warning}</p>
          </div>
          <div className="h-10 w-10 bg-status-warning/15 text-status-warning rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Main Table controls */}
      <Card className="border border-border bg-bg-surface">
        <CardHeader className="p-5 border-b border-border/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search fleet by name, IP, or protocol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bulk Actions Panel */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-bg-elevated/40 border border-border p-1.5 rounded-lg">
              <span className="text-xs text-text-muted px-2 font-medium">{selectedIds.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)} disabled={actionLoading} className="h-8 text-status-success border-status-success/20 hover:bg-status-success/5 cursor-pointer">
                <Play className="h-3.5 w-3.5 mr-1" /> Start
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)} disabled={actionLoading} className="h-8 text-text-muted cursor-pointer">
                <Square className="h-3.5 w-3.5 mr-1" /> Stop
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkKill} disabled={actionLoading} className="h-8 text-status-error border-status-error/20 hover:bg-status-error/5 cursor-pointer">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Kill
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-bg-elevated/20 text-text-muted text-xs uppercase font-semibold">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === virtualDevices.length && virtualDevices.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                </th>
                <th className="p-4">Device Name</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Protocol</th>
                <th className="p-4">Status</th>
                <th className="p-4">Telemetry Signal</th>
                <th className="p-4">Simulation Switch</th>
              </tr>
            </thead>
            <tbody>
              {virtualDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-text-muted">
                    No active virtual device workers found in list.
                  </td>
                </tr>
              ) : (
                virtualDevices.map((device) => {
                  const isSelected = selectedIds.includes(device.id)
                  return (
                    <tr 
                      key={device.id} 
                      className={cn(
                        "border-b border-border/40 hover:bg-bg-elevated/10 transition-colors",
                        isSelected && "bg-accent/5 hover:bg-accent/10"
                      )}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(device.id, e.target.checked)}
                          className="rounded border-border text-accent focus:ring-accent"
                        />
                      </td>
                      <td className="p-4 font-semibold text-text-primary">
                        {device.name}
                        <div className="text-[10px] text-text-muted font-normal mt-0.5">{device.id}</div>
                      </td>
                      <td className="p-4 font-mono text-xs">{device.ipAddress}</td>
                      <td className="p-4">
                        <span className="bg-bg-elevated text-text-muted text-xs font-semibold px-2 py-0.5 rounded border border-border">
                          {device.protocol}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusPill status={device.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            device.status === 'online' ? "bg-status-success animate-pulse" : "bg-text-muted"
                          )} />
                          <span className="text-xs text-text-muted">
                            {device.status === 'online' ? "Broadcasting (5s)" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDevice(device.id, !device.isToggledOn)}
                          className={cn(
                            "h-8 text-xs font-semibold cursor-pointer",
                            device.isToggledOn 
                              ? "text-status-error border-status-error/15 hover:bg-status-error/5" 
                              : "text-status-success border-status-success/15 hover:bg-status-success/5"
                          )}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {device.isToggledOn ? 'Stop simulation' : 'Start simulation'}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
