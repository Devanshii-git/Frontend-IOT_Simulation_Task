import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  interactive?: boolean
}

export function Card({ children, className, onClick, interactive }: CardProps) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border-light bg-white p-4 dark:border-border-dark dark:bg-slate-900',
        interactive && 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.99]',
        className,
      )}
    >
      {children}
    </Comp>
  )
}
