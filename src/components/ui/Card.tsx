import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { ParticleCard } from './MagicBento'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  onClick?: () => void
  enableStars?: boolean
  enableBorderGlow?: boolean
  enableTilt?: boolean
  enableMagnetism?: boolean
  clickEffect?: boolean
  particleCount?: number
  glowColor?: string
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      interactive = false,
      onClick,
      enableStars = true,
      enableBorderGlow = true,
      enableTilt = true,
      enableMagnetism = false,
      clickEffect = true,
      particleCount = 12,
      glowColor = '13, 148, 136', // signature teal by default
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isActuallyInteractive = interactive || !!onClick

    const bentoClassName = cn(
      'magic-bento-card bg-bg-surface rounded-xl border border-border transition-all duration-300',
      enableBorderGlow && 'magic-bento-card--border-glow',
      isActuallyInteractive && 'cursor-pointer hover:shadow-md hover:border-border-accent/40',
      className
    )

    const mergedStyle = {
      '--glow-color': glowColor,
      ...style,
    } as React.CSSProperties

    return (
      <ParticleCard
        ref={ref}
        className={bentoClassName}
        style={mergedStyle}
        disableAnimations={!isActuallyInteractive}
        particleCount={isActuallyInteractive && enableStars ? particleCount : 0}
        enableTilt={isActuallyInteractive ? enableTilt : false}
        enableMagnetism={isActuallyInteractive ? enableMagnetism : false}
        clickEffect={isActuallyInteractive ? clickEffect : false}
        glowColor={glowColor}
        onClick={onClick}
        {...props}
      >
        <div className="relative z-10 h-full w-full">
          {children}
        </div>
      </ParticleCard>
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
