import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  onClick?: () => void
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive, onClick, ...props }, ref) => {
    if (onClick) {
      return (
        <button
          ref={ref as any}
          onClick={onClick}
          className={cn(
            'rounded-xl border border-border bg-bg-surface p-5 text-left transition-all',
            interactive && 'cursor-pointer hover:shadow-md hover:border-border-accent/50 active:scale-[0.99]',
            className
          )}
          {...(props as any)}
        />
      )
    }
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-border bg-bg-surface p-5 text-left transition-all',
          interactive && 'cursor-pointer hover:shadow-md hover:border-border-accent/50 active:scale-[0.99]',
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight text-lg text-text-primary', className)} {...props} />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-muted', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4 border-t border-border', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'
