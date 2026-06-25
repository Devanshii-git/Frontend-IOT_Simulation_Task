import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Cpu } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  terms: z.boolean().refine((v) => v, { message: 'You must accept the terms' }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', terms: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    const result = schema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/verify-otp')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary transition-colors items-center justify-center px-6 py-12 select-none">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Create account</h2>
          <p className="text-sm text-text-muted font-medium">
            Start monitoring and simulating your IoT devices.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="you@domain.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />
          
          <div className="flex flex-col gap-1">
            <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-border bg-bg-surface text-accent focus:ring-accent-subtle/40"
              />
              <span className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                I agree to the{' '}
                <button type="button" className="text-accent hover:text-accent-hover cursor-pointer">
                  Terms of Service
                </button>
              </span>
            </label>
            {errors.terms && <p className="text-[11px] text-status-error font-medium">{errors.terms}</p>}
          </div>

          {apiError && <p className="text-sm font-medium text-status-error">{apiError}</p>}
          
          <Button type="submit" className="w-full h-11" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:text-accent-hover cursor-pointer">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
