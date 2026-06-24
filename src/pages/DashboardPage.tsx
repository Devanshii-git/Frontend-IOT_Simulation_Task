import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Cpu, Wifi, WifiOff, Bell } from 'lucide-react'
import { Card } from '@/components/ui/Card'
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
    { label: 'Total Devices', value: stats.total, icon: Cpu, color: 'text-primary-600', filter: {} },
    { label: 'Online', value: stats.online, icon: Wifi, color: 'text-emerald-600', filter: { status: 'online' as DeviceStatus } },
    { label: 'Offline', value: stats.offline, icon: WifiOff, color: 'text-slate-500', filter: { status: 'offline' as DeviceStatus } },
    { label: 'Active Alerts', value: alertCount, icon: Bell, color: 'text-red-600', filter: null },
  ]

  const handleStatClick = (filter: { status?: DeviceStatus } | null) => {
    if (filter === null) { navigate('/alerts'); return }
    setFilters(filter)
    navigate('/devices')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your IoT network</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map(({ label, value, icon: Icon, color, filter }) => (
            <Card key={label} interactive onClick={() => handleStatClick(filter)} className="text-left w-full">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <Icon className={cn('h-5 w-5', color)} />
              </div>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </Card>
          ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Device Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.entries(deviceTypeConfig) as [keyof typeof deviceTypeConfig, typeof deviceTypeConfig.temperature][]).map(([type, cfg]) => {
            const count = devices.filter((d) => d.type === type).length
            const Icon = cfg.icon
            return (
              <Card
                key={type}
                interactive
                onClick={() => { setFilters({ type }); navigate('/devices') }}
                className="text-center"
              >
                <div className={cn('mx-auto flex h-10 w-10 items-center justify-center rounded-lg', cfg.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-2 text-sm font-medium">{cfg.label}</p>
                <p className="text-xs text-slate-500">{count} devices</p>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
        <Card className="max-h-64 overflow-y-auto scrollbar-thin">
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 border-b border-border-light pb-3 last:border-0 dark:border-border-dark">
                <div className={cn(
                  'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                  a.type === 'error' ? 'bg-red-500' : a.type === 'warning' ? 'bg-amber-500' : a.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.message}</p>
                  <p className="text-xs text-slate-500">{formatRelativeTime(a.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <button
        onClick={() => navigate('/devices?add=true')}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 md:bottom-6 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
