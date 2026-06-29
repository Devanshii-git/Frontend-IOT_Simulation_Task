import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Cpu, Globe } from 'lucide-react'
import { DotGrid } from '@/components/DotGrid'
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
    <div className="flex min-h-screen bg-bg-primary text-text-primary transition-colors select-none">
      {/* Left Decoration Panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-bg-primary p-12 overflow-hidden border-r border-border">
        <DotGrid />

        <div className="relative z-[2] flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-xl text-text-primary bg-bg-primary p-2 rounded-xl">AlignAV</span>
        </div>

        <div className="relative z-[2] space-y-4 max-w-lg bg-bg-primary p-3 rounded-xl">
          <h2 className="text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
            Comprehensive IoT Device Simulation
          </h2>
          <p className="text-text-muted font-medium text-base leading-relaxed">
            Configure mock device networks, simulate real-time sensor metrics, track alerts frequency, and provision API credentials.
          </p>
        </div>

        <div className="relative z-[2] text-xs text-text-muted font-medium">
          AlignAV &copy; 2026. All rights reserved.
        </div>
      </div>

      {/* Right Credentials Form Panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-text-muted font-medium">
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
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Password</span>
                <button type="button" className="text-xs font-semibold text-accent hover:text-accent-hover cursor-pointer">Forgot password?</button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
            </div>

            {apiError && <p className="text-sm font-medium text-status-error">{apiError}</p>}
            
            <Button type="submit" className="w-full h-11" loading={loading}>
              Continue
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-bg-primary px-3 font-semibold text-text-muted">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="h-10 text-xs">
              <Globe className="h-4 w-4 text-text-muted" /> Google
            </Button>
            <Button variant="outline" type="button" className="h-10 text-xs">
              <Cpu className="h-4 w-4 text-text-muted" /> GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-text-muted font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-accent hover:text-accent-hover cursor-pointer">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
