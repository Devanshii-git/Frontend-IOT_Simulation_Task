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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary-500/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-500/30">
          <Cpu className="h-10 w-10 text-white animate-pulse" />
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold text-white">IoT Sim</h1>
      <p className="mt-2 text-sm text-slate-400">Device Simulation & Monitoring</p>
      <div className="mt-8 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
