import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Cpu, Wifi, WifiOff, Bell, Activity } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useDeviceStore } from '@/store/deviceStore'
import { useAlertStore } from '@/store/alertStore'
import { getActivitiesApi } from '@/services/api'
import { deviceTypeConfig } from '@/utils/deviceIcons'
import { formatRelativeTime } from '@/utils/format'
import type { ActivityItem, DeviceStatus } from '@/types'
import { cn } from '@/utils/cn'

export function DashboardPage() {
  const navigate = useNavigate()
  const devices = useDeviceStore((s) => s.devices)
  const loading = useDeviceStore((s) => s.loading)
  const fetchDevices = useDeviceStore((s) => s.fetchDevices)
  const setFilters = useDeviceStore((s) => s.setFilters)
  const alerts = useAlertStore((s) => s.alerts)
  const fetchAlerts = useAlertStore((s) => s.fetchAlerts)
  const [activities, setActivities] = useState<ActivityItem[]>([])

  const alertCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged).length,
    [alerts],
  )

  const stats = useMemo(() => ({
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    warning: devices.filter((d) => d.status === 'warning').length,
    alerts: devices.filter((d) => d.status === 'warning' || d.status === 'offline').length,
  }), [devices])

  useEffect(() => {
    fetchDevices()
    fetchAlerts()
    getActivitiesApi().then(setActivities)
  }, [fetchDevices, fetchAlerts])

  const statCards = [
    { label: 'Total Devices', value: stats.total, icon: Cpu, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', filter: {} },
    { label: 'Online Sensors', value: stats.online, icon: Wifi, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', filter: { status: 'online' as DeviceStatus } },
    { label: 'Offline Nodes', value: stats.offline, icon: WifiOff, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', filter: { status: 'offline' as DeviceStatus } },
    { label: 'Active Alerts', value: alertCount, icon: Bell, color: 'text-red-500 bg-red-500/10 border-red-500/20', filter: null },
  ]

  const handleStatClick = (filter: { status?: DeviceStatus } | null) => {
    if (filter === null) { navigate('/alerts'); return }
    setFilters(filter)
    navigate('/devices')
  }

  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Overview of your IoT simulation network activity.</p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map(({ label, value, icon: Icon, color, filter }) => (
            <Card key={label} interactive onClick={() => handleStatClick(filter)} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', color)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="p-0 mt-3">
                <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase mt-1">System Node telemetry</p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Device Categories */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-bold tracking-tight">Device Categories</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.entries(deviceTypeConfig) as [keyof typeof deviceTypeConfig, typeof deviceTypeConfig.temperature][]).map(([type, cfg]) => {
            const count = devices.filter((d) => d.type === type).length
            const Icon = cfg.icon
            return (
              <Card
                key={type}
                interactive
                onClick={() => { setFilters({ type }); navigate('/devices') }}
                className="flex flex-col items-center justify-center text-center p-5"
              >
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', cfg.color)}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">{cfg.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{count} active</p>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">Recent System Activity</h2>
        <Card className="max-h-72 overflow-y-auto scrollbar-thin p-0">
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 font-medium">No activity registered.</div>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                  <div className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    a.type === 'error' ? 'bg-red-500' : a.type === 'warning' ? 'bg-amber-500' : a.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500',
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{a.message}</p>
                    <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-0.5">{formatRelativeTime(a.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Add Device action key for mobile screens */}
      <button
        onClick={() => navigate('/devices?add=true')}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 md:bottom-6 lg:hidden cursor-pointer"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
