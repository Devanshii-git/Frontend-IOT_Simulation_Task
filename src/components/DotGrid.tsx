import { useEffect, useRef } from 'react'

interface DotGridProps {
  dotSpacing?: number
  dotRadius?: number
  repulsionRadius?: number
  repulsionStrength?: number
  lerpFactor?: number
  opacity?: number
}

interface Dot {
  homeX: number
  homeY: number
  dx: number
  dy: number
}

const getDotColor = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue('--color-dot')
    .trim()

export function DotGrid({
  dotSpacing = 28,
  dotRadius = 2,
  repulsionRadius = 100,
  repulsionStrength = 20,
  lerpFactor = 0.08,
  opacity = 0.25,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const mousePosRef = useRef({ x: -1000, y: -1000 })
  const dotColorRef = useRef(getDotColor())
  const animationFrameRef = useRef(0)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      dotColorRef.current = getDotColor()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let resizeTimeout: ReturnType<typeof setTimeout>

    const setupGrid = () => {
      const rect = wrapper.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = rect.width
      const height = rect.height

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const dots: Dot[] = []
      for (let x = dotSpacing / 2; x < width; x += dotSpacing) {
        for (let y = dotSpacing / 2; y < height; y += dotSpacing) {
          dots.push({ homeX: x, homeY: y, dx: 0, dy: 0 })
        }
      }
      dotsRef.current = dots
    }

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(setupGrid, 150)
    }

    setupGrid()
    window.addEventListener('resize', handleResize)

    const animate = () => {
      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      ctx.clearRect(0, 0, width, height)

      const mouse = mousePosRef.current
      const dots = dotsRef.current

      for (const dot of dots) {
        dot.dx *= 1 - lerpFactor
        dot.dy *= 1 - lerpFactor

        const distX = mouse.x - dot.homeX
        const distY = mouse.y - dot.homeY
        const distance = Math.sqrt(distX * distX + distY * distY)

        if (distance < repulsionRadius && distance > 0) {
          const pushStrength = repulsionStrength * (1 - distance / repulsionRadius)
          dot.dx -= (distX / distance) * pushStrength
          dot.dy -= (distY / distance) * pushStrength
        }

        ctx.beginPath()
        ctx.arc(dot.homeX + dot.dx, dot.homeY + dot.dy, dotRadius, 0, Math.PI * 2)
        ctx.fillStyle = dotColorRef.current
        ctx.fill()
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [dotSpacing, dotRadius, repulsionRadius, repulsionStrength, lerpFactor])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseLeave = () => {
    mousePosRef.current = { x: -1000, y: -1000 }
  }

  return (
    <>
      <div
        ref={wrapperRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity,
          pointerEvents: 'none',
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          cursor: 'none',
          pointerEvents: 'auto',
          background: 'transparent',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </>
  )
}
