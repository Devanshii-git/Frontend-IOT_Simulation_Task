import { cn } from '@/utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700', className)} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}
