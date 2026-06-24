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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 select-none overflow-hidden">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Concentric Rings */}
        <div className="absolute h-36 w-36 animate-ping rounded-full bg-primary-600/10 duration-1000" />
        <div className="absolute h-28 w-28 animate-ping rounded-full bg-primary-500/15 duration-700" />
        
        {/* Glowing Logo Container */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-600 shadow-xl shadow-primary-600/30 ring-1 ring-primary-500/20">
          <Cpu className="h-10 w-10 text-white animate-pulse" />
        </div>
      </div>
      
      {/* Brand details */}
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
        AlignAV
      </h1>
      <p className="mt-2 text-sm text-slate-400 font-medium tracking-wide">
        IoT Device Simulation & Telemetry Monitoring
      </p>

      {/* Bounce loader dot indicators */}
      <div className="mt-8 flex gap-1.5 justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
