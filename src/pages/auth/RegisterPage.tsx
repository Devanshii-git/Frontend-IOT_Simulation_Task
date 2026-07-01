import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Cpu } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Lightfall from '@/components/ui/Lightfall'
import { BlurText } from '@/components/ui/BlurText'
import { ShinyText } from '@/components/ui/ShinyText'

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 14,
    },
  },
}

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
    <div className="relative flex min-h-screen text-text-primary transition-colors items-center justify-center px-6 py-12 select-none overflow-hidden bg-black">
      {/* Full Page Lightfall WebGL Background */}
      <div className="absolute inset-0 z-0">
        <Lightfall
          colors={['#A6C8FF', '#5227FF', '#FF9FFC']}
          backgroundColor="#020412"
          speed={0.5}
          streakCount={4}
          streakWidth={1}
          streakLength={1}
          glow={1.2}
          density={0.6}
          twinkle={1}
          zoom={3}
          backgroundGlow={0.6}
          opacity={1}
          mouseInteraction={false}
          mouseStrength={0.6}
          mouseRadius={1.2}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-md space-y-6 bg-[rgba(82,39,255,0.08)] dark:bg-[rgba(82,39,255,0.04)] backdrop-blur-xl border border-purple-500/20 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-accent/5 z-10 relative"
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent mb-1 shadow-md shadow-accent/15">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            <BlurText text="Create account" delay={0.06} />
          </h2>
          <p className="text-sm text-white/60 font-medium">
            Start monitoring and simulating your IoT devices.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants}>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/75 mb-1 block">
              Full Name
            </label>
            <Input
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              className="bg-white/10 dark:bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent/30 focus-visible:border-accent"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/75 mb-1 block">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="you@domain.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              className="bg-white/10 dark:bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent/30 focus-visible:border-accent"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/75 mb-1 block">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              className="bg-white/10 dark:bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent/30 focus-visible:border-accent"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/75 mb-1 block">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              className="bg-white/10 dark:bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent/30 focus-visible:border-accent"
            />
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex flex-col gap-1 pt-1">
            <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-white/10 bg-white/10 text-accent focus:ring-accent-subtle/40"
              />
              <span className="text-xs text-white/70 font-semibold uppercase tracking-wide">
                I agree to the{' '}
                <button type="button" className="text-accent hover:text-accent-hover cursor-pointer font-bold">
                  Terms of Service
                </button>
              </span>
            </label>
            {errors.terms && <p className="text-[11px] text-status-error font-medium">{errors.terms}</p>}
          </motion.div>

          {apiError && (
            <motion.p variants={itemVariants} className="text-sm font-medium text-status-error">
              {apiError}
            </motion.p>
          )}
          
          <motion.div variants={itemVariants} className="pt-2">
            <Button type="submit" className="w-full h-11 shadow-md shadow-accent/15" loading={loading}>
              <ShinyText text="Create account" className="text-white font-bold" disabled={loading} />
            </Button>
          </motion.div>
        </form>

        <motion.p variants={itemVariants} className="text-center text-sm text-white/60 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:text-accent-hover cursor-pointer">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
