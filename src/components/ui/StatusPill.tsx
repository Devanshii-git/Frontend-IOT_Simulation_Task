import { cn } from '@/utils/cn'
import type { DeviceStatus, AlertSeverity } from '@/types'

const statusStyles: Record<DeviceStatus, string> = {
  online: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  offline: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
}

const severityStyles: Record<AlertSeverity, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

interface StatusPillProps {
  status: DeviceStatus | AlertSeverity | string
  className?: string
}

export function StatusPill({ status, className }: StatusPillProps) {
  const style = statusStyles[status as DeviceStatus] ?? severityStyles[status as AlertSeverity] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', style, className)}>
      {status}
    </span>
  )
}
