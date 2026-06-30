import { cn } from '@/utils/cn'

interface SignalStrengthProps {
  strength: number
  className?: string
}

export function SignalStrength({ strength, className }: SignalStrengthProps) {
  const bars = [20, 40, 60, 80]
  return (
    <div className={cn('flex items-end gap-0.5 h-4', className)} title={`${strength}%`}>
      {bars.map((threshold, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-sm',
            strength >= threshold ? 'bg-status-online' : 'bg-text-muted/40',
          )}
          style={{ height: `${(i + 1) * 25}%` }}
        />
      ))}
    </div>
  )
}
