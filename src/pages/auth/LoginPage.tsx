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
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-slate-900 p-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600">
          <Cpu className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-white">IoT Simulation Platform</h1>
        <p className="mt-3 text-slate-400">Monitor, simulate, and manage your connected devices in real time.</p>
      </div>
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
            <div className="flex justify-end">
              <button type="button" className="text-sm text-primary-600 hover:underline">Forgot password?</button>
            </div>
            {apiError && <p className="text-sm text-red-500">{apiError}</p>}
            <Button type="submit" className="w-full" loading={loading}>Sign in</Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-light dark:border-border-dark" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-muted-light dark:bg-surface-dark px-2 text-slate-500">Or continue with</span></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" type="button"><Globe className="h-4 w-4" /> Google</Button>
              <Button variant="outline" type="button"><Cpu className="h-4 w-4" /> GitHub</Button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account? <Link to="/register" className="text-primary-600 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
