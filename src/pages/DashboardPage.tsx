import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Cpu, Bell } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useDeviceStore } from '@/store/deviceStore'
import { useAlertStore } from '@/store/alertStore'
import { SIMULATOR_DEVICE_TYPE_LABELS } from '@/utils/simulatorDevices'
import type { SimulatorDeviceType } from '@/types'
import { cn } from '@/utils/cn'

export function DashboardPage() {
  const navigate = useNavigate()
  const runningDevices = useDeviceStore((s) => s.runningDevices)
  const telemetry = useDeviceStore((s) => s.telemetry)
  const loading = useDeviceStore((s) => s.loading)
  const refreshAll = useDeviceStore((s) => s.refreshAll)
  const alerts = useAlertStore((s) => s.alerts)
  const fetchAlerts = useAlertStore((s) => s.fetchAlerts)

  const alertCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged).length,
    [alerts],
  )

  useEffect(() => {
    refreshAll().catch(() => {})
    fetchAlerts().catch(() => {})
  }, [refreshAll, fetchAlerts])

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<SimulatorDeviceType, number>> = {}
    for (const id of runningDevices) {
      const type = telemetry[id]?.device_type
      if (type) counts[type] = (counts[type] ?? 0) + 1
    }
    return counts
  }, [runningDevices, telemetry])

  const statCards = [
    { label: 'Running Devices', value: runningDevices.length, icon: Cpu, color: 'text-accent bg-accent/10 border-accent/20', onClick: () => navigate('/devices') },
    { label: 'Active Alerts', value: alertCount, icon: Bell, color: 'text-status-error bg-status-error/10 border-status-error/20', onClick: () => navigate('/alerts') },
  ]

  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted font-medium">Overview of your IoT simulation network activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading && runningDevices.length === 0
          ? Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map(({ label, value, icon: Icon, color, onClick }) => (
            <Card key={label} interactive onClick={onClick} className="w-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</span>
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', color)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="p-0 mt-3">
                <div className="text-3xl font-bold tracking-tight text-text-primary">{value}</div>
                <p className="text-[11px] font-semibold text-text-muted uppercase mt-1">Live from backend</p>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">Running Device Types</h2>
        {runningDevices.length === 0 ? (
          <Card className="py-10 text-center">
            <p className="text-sm text-text-muted font-medium">No devices running.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.entries(typeCounts) as [SimulatorDeviceType, number][]).map(([type, count]) => (
              <Card
                key={type}
                interactive
                onClick={() => navigate('/devices')}
                className="flex flex-col items-center justify-center text-center p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  {SIMULATOR_DEVICE_TYPE_LABELS[type]}
                </p>
                <p className="text-xs text-text-muted font-semibold mt-1">{count} active</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/devices?add=true')}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/20 hover:bg-accent-hover active:bg-accent-active md:bottom-6 lg:hidden cursor-pointer"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  )
}
