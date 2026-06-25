import { cn } from '@/utils/cn'
import type { DeviceStatus, AlertSeverity } from '@/types'

const statusStyles: Record<DeviceStatus, string> = {
  online: 'bg-status-online/15 text-status-online',
  offline: 'bg-status-offline/15 text-status-offline',
  warning: 'bg-status-warning/15 text-status-warning',
}

const severityStyles: Record<AlertSeverity, string> = {
  critical: 'bg-status-error/15 text-status-error',
  warning: 'bg-status-warning/15 text-status-warning',
  info: 'bg-accent/15 text-accent',
}

interface StatusPillProps {
  status: DeviceStatus | AlertSeverity | string
  className?: string
}

export function StatusPill({ status, className }: StatusPillProps) {
  const style = statusStyles[status as DeviceStatus] ?? severityStyles[status as AlertSeverity] ?? 'bg-status-offline/15 text-status-offline'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', style, className)}>
      {status}
    </span>
  )
}
