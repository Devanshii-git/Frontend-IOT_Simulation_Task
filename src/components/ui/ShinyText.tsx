interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

export function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = '',
}: ShinyTextProps) {
  const animationDuration = `${speed}s`

  return (
    <span
      className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-accent to-text-primary ${
        disabled ? '' : 'animate-shine'
      } ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animationDuration: disabled ? undefined : animationDuration,
      }}
    >
      {text}
    </span>
  )
}
