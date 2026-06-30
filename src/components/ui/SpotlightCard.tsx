import React from 'react'
import { Card } from './Card'

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
  interactive?: boolean
  onClick?: () => void
}

function parseColorToRgbString(color: string | undefined): string {
  if (!color) return '13, 148, 136' // default AlignAV teal

  // Hex colors
  if (color.startsWith('#')) {
    let hex = color.substring(1)
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `${r}, ${g}, ${b}`
    }
  }

  // rgb/rgba colors
  const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (match) {
    return `${match[1]}, ${match[2]}, ${match[3]}`
  }

  return '13, 148, 136'
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor,
  interactive = false,
  onClick,
  ...props
}: SpotlightCardProps) {
  const glowColor = parseColorToRgbString(spotlightColor)

  return (
    <Card
      interactive={interactive}
      onClick={onClick}
      className={className}
      glowColor={glowColor}
      enableStars={interactive}
      enableTilt={interactive}
      enableMagnetism={false} // Disable magnetism by default on dashboard cards to avoid shaking text
      clickEffect={interactive}
      {...props}
    >
      {children}
    </Card>
  )
}
