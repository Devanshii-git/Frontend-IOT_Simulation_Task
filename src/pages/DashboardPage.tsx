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
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { SpotlightCard } from '@/components/ui/SpotlightCard'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
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
    { label: 'Total Devices', value: stats.total, icon: Cpu, color: 'text-accent bg-accent/10 border-accent/20', spotlightColor: 'rgba(13, 148, 136, 0.15)', filter: {} },
    { label: 'Online Sensors', value: stats.online, icon: Wifi, color: 'text-status-online bg-status-online/10 border-status-online/20', spotlightColor: 'rgba(13, 148, 136, 0.15)', filter: { status: 'online' as DeviceStatus } },
    { label: 'Offline Nodes', value: stats.offline, icon: WifiOff, color: 'text-status-offline bg-status-offline/10 border-status-offline/20', spotlightColor: 'rgba(107, 114, 128, 0.15)', filter: { status: 'offline' as DeviceStatus } },
    { label: 'Active Alerts', value: alertCount, icon: Bell, color: 'text-status-error bg-status-error/10 border-status-error/20', spotlightColor: 'rgba(239, 68, 68, 0.15)', filter: null },
  ]

  const handleStatClick = (filter: { status?: DeviceStatus } | null) => {
    if (filter === null) { navigate('/alerts'); return }
    setFilters(filter)
    navigate('/devices')
  }

  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted font-medium">Overview of your IoT simulation network activity.</p>
      </div>

      {/* Stats Cards Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <CardSkeleton />
              </motion.div>
            ))
          : statCards.map(({ label, value, icon: Icon, color, spotlightColor, filter }) => (
              <motion.div key={label} variants={itemVariants}>
                <SpotlightCard
                  interactive
                  onClick={() => handleStatClick(filter)}
                  spotlightColor={spotlightColor}
                  className="w-full"
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', color)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 mt-3">
                    <div className="text-3xl font-bold tracking-tight text-text-primary">{value}</div>
                    <p className="text-[11px] font-semibold text-text-muted uppercase mt-1">System Node telemetry</p>
                  </CardContent>
                </SpotlightCard>
              </motion.div>
            ))}
      </motion.div>

      {/* Device Categories */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold tracking-tight">Device Categories</h2>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {(Object.entries(deviceTypeConfig) as [keyof typeof deviceTypeConfig, typeof deviceTypeConfig.temperature][]).map(([type, cfg]) => {
            const count = devices.filter((d) => d.type === type).length
            const Icon = cfg.icon
            return (
              <motion.div key={type} variants={itemVariants}>
                <SpotlightCard
                  interactive
                  onClick={() => { setFilters({ type }); navigate('/devices') }}
                  className="flex flex-col items-center justify-center text-center p-5 h-full"
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', cfg.color)}>
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-text-primary">{cfg.label}</p>
                  <p className="text-xs text-text-muted font-semibold mt-1">{count} active</p>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Recent Activity Feed */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">Recent System Activity</h2>
        <Card className="max-h-72 overflow-y-auto scrollbar-thin p-0">
          <CardContent className="p-0">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-muted font-medium">No activity registered.</div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-border"
              >
                {activities.map((a) => (
                  <motion.div
                    key={a.id}
                    variants={itemVariants}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-bg-elevated/50"
                  >
                    <div className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      a.type === 'error' ? 'bg-status-error' : a.type === 'warning' ? 'bg-status-warning' : a.type === 'success' ? 'bg-status-online' : 'bg-accent',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-secondary truncate">{a.message}</p>
                      <p className="text-xs text-text-muted font-medium mt-0.5">{formatRelativeTime(a.timestamp)}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Add Device action key for mobile screens */}
      <button
        onClick={() => navigate('/devices?add=true')}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accent-hover active:bg-accent-active md:bottom-6 lg:hidden cursor-pointer"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
