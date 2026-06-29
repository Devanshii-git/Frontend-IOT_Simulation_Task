import { useEffect } from 'react'
import { Cpu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export function SplashScreen() {
  const setSplashDone = useAuthStore((s) => s.setSplashDone)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashDone()
      navigate(isAuthenticated ? '/' : '/login')
    }, 2000)
    return () => clearTimeout(timer)
  }, [setSplashDone, isAuthenticated, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary text-text-primary select-none overflow-hidden">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Concentric Rings */}
        <div className="absolute h-36 w-36 animate-ping rounded-full bg-accent/10 duration-1000" />
        <div className="absolute h-28 w-28 animate-ping rounded-full bg-accent/15 duration-700" />
        
        {/* Glowing Logo Container */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-accent shadow-xl shadow-accent/30 ring-1 ring-accent/20">
          <Cpu className="h-10 w-10 text-white animate-pulse" />
        </div>
      </div>
      
      {/* Brand details */}
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-text-primary">
        AlignAV
      </h1>
      <p className="mt-2 text-sm text-text-muted font-medium tracking-wide">
        IoT Device Simulation & Telemetry Monitoring
      </p>

      {/* Bounce loader dot indicators */}
      <div className="mt-8 flex gap-1.5 justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-accent shadow-sm shadow-accent/50 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
