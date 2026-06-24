import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Cpu, Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export function LoginPage() {
  const [email, setEmail] = useState('demo@iotlab.dev')
  const [password, setPassword] = useState('demo123')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    const result = schema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors select-none">
      {/* Left Decoration Panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 overflow-hidden border-r border-slate-800">
        {/* Animated Grid & Topology lines */}
        <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <line x1="15%" y1="25%" x2="45%" y2="50%" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" />
          <line x1="45%" y1="50%" x2="80%" y2="35%" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" />
          <line x1="45%" y1="50%" x2="65%" y2="75%" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" />
          <line x1="15%" y1="25%" x2="35%" y2="70%" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
          
          <circle cx="15%" cy="25%" r="6" fill="#3b82f6" className="animate-pulse" />
          <circle cx="45%" cy="50%" r="8" fill="#3b82f6" />
          <circle cx="80%" cy="35%" r="5" fill="#10b981" />
          <circle cx="65%" cy="75%" r="7" fill="#3b82f6" />
          <circle cx="35%" cy="70%" r="5" fill="#f59e0b" className="animate-pulse" />
        </svg>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-xl text-white">AlignAV</span>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg">
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Comprehensive IoT Device Simulation
          </h2>
          <p className="text-slate-400 font-medium text-base leading-relaxed">
            Configure mock device networks, simulate real-time sensor metrics, track alerts frequency, and provision API credentials.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium">
          AlignAV &copy; 2026. All rights reserved.
        </div>
      </div>

      {/* Right Credentials Form Panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Sign in to manage your simulated device ecosystem.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</span>
                <button type="button" className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">Forgot password?</button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
            </div>

            {apiError && <p className="text-sm font-medium text-red-500">{apiError}</p>}
            
            <Button type="submit" className="w-full h-11" loading={loading}>
              Continue
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 dark:bg-slate-950 px-3 font-semibold text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="h-10 text-xs">
              <Globe className="h-4 w-4 text-slate-500" /> Google
            </Button>
            <Button variant="outline" type="button" className="h-10 text-xs">
              <Cpu className="h-4 w-4 text-slate-500" /> GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
