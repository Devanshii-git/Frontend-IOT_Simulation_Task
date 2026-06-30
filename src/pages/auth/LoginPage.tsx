import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Cpu, Globe } from 'lucide-react'
import Lightfall from '@/components/ui/Lightfall'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ShinyText } from '@/components/ui/ShinyText'
import TextType from '@/components/ui/TextType'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
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

export function LoginPage() {
  const [email, setEmail] = useState('demo@iotlab.dev')
  const [password, setPassword] = useState('demo123')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Social login state
  const [showGoogleOAuth, setShowGoogleOAuth] = useState(false)
  const [showGithubOAuth, setShowGithubOAuth] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')

  const login = useAuthStore((s) => s.login)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const loginWithGithub = useAuthStore((s) => s.loginWithGithub)
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

  const handleSocialLogin = async (provider: 'Google' | 'GitHub', name: string, email: string) => {
    setLoading(true)
    setApiError('')
    setShowGoogleOAuth(false)
    setShowGithubOAuth(false)
    try {
      const mockToken = `mock-${provider.toLowerCase()}-token-${Date.now()}`
      if (provider === 'Google') {
        await loginWithGoogle(name, email, mockToken)
      } else {
        await loginWithGithub(name, email, mockToken)
      }
      navigate('/')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : `${provider} sign in failed`)
    } finally {
      setLoading(false)
      setCustomName('')
      setCustomEmail('')
    }
  }

  return (
    <div className="relative flex min-h-screen text-text-primary transition-colors select-none overflow-hidden bg-black">
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
          mouseInteraction
          mouseStrength={0.6}
          mouseRadius={1.2}
        />
      </div>

      {/* Left Decoration Panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden z-10 bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-[2] flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-xl text-white bg-transparent">
            AlignAV
          </span>
        </motion.div>

        <div className="relative z-[2] space-y-4 max-w-lg bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-accent/5">
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Comprehensive IoT Device Simulation
          </h2>
          <TextType
            text={[
              "Configure mock device networks.",
              "Simulate real-time sensor metrics.",
              "Track alerts frequency and telemetry.",
              "Provision secure API credentials."
            ]}
            typingSpeed={50}
            deletingSpeed={35}
            pauseDuration={2000}
            loop={true}
            showCursor={true}
            cursorCharacter="_"
            className="text-white/70 font-medium text-base leading-relaxed min-h-[48px]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-[2] text-xs text-white/50 font-semibold"
        >
          AlignAV &copy; 2026. All rights reserved.
        </motion.div>
      </div>

      {/* Right Credentials Form Panel */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 z-10 bg-transparent">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto w-full max-w-md space-y-8 bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-accent/5"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-white/60 font-medium">
              Sign in to manage your simulated device ecosystem.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={itemVariants} className="relative">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/75 mb-1 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                className="bg-white/10 dark:bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent/30 focus-visible:border-accent"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/75">
                  Password
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-accent hover:text-accent-hover cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                className="bg-white/10 dark:bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent/30 focus-visible:border-accent"
              />
            </motion.div>

            {apiError && (
              <motion.p
                variants={itemVariants}
                className="text-sm font-medium text-status-error"
              >
                {apiError}
              </motion.p>
            )}

            <motion.div variants={itemVariants}>
              <Button type="submit" className="w-full h-11 shadow-md shadow-accent/15" loading={loading}>
                <ShinyText text="Continue" className="text-white font-bold" disabled={loading} />
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="flex-1 border-t border-white/15" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 shrink-0">
              Or continue with
            </span>
            <div className="flex-1 border-t border-white/15" />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowGoogleOAuth(true)}
              className="h-10 text-xs bg-white/5 hover:bg-white/10 transition-colors border-white/15 shadow-sm text-white cursor-pointer"
            >
              <Globe className="h-4 w-4 text-white/70 mr-1.5" /> Google
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowGithubOAuth(true)}
              className="h-10 text-xs bg-white/5 hover:bg-white/10 transition-colors border-white/15 shadow-sm text-white cursor-pointer"
            >
              <Cpu className="h-4 w-4 text-white/70 mr-1.5" /> GitHub
            </Button>
          </motion.div>

          <motion.p variants={itemVariants} className="text-center text-sm text-white/60 font-medium">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-accent hover:text-accent-hover cursor-pointer"
            >
              Sign up
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Google OAuth Modal */}
      {showGoogleOAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-[#0f1222] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 text-white"
          >
            <div className="flex items-center gap-2 text-white">
              <Globe className="h-6 w-6 text-accent animate-pulse" />
              <h3 className="text-lg font-bold">Sign in with Google</h3>
            </div>
            <p className="text-xs text-white/60">Choose an account to continue to AlignAV</p>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google', 'Alex Rivera', 'alex@iotlab.dev')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left text-sm cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">A</div>
                <div>
                  <p className="font-semibold">Alex Rivera</p>
                  <p className="text-xs text-white/40">alex@iotlab.dev</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleSocialLogin('Google', 'Demo User', 'demo@iotlab.dev')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left text-sm cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">D</div>
                <div>
                  <p className="font-semibold">Demo User</p>
                  <p className="text-xs text-white/40">demo@iotlab.dev</p>
                </div>
              </button>
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 block">Or use a custom account</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-accent"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google', customName, customEmail)}
                  disabled={!customName || !customEmail}
                  className="w-full h-9 rounded-lg bg-accent text-white font-semibold text-xs hover:bg-accent-hover disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setShowGoogleOAuth(false); setCustomName(''); setCustomEmail(''); }}
              className="w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors mt-2 cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* GitHub OAuth Modal */}
      {showGithubOAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-[#0f1222] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 text-white"
          >
            <div className="flex items-center gap-2 text-white">
              <Cpu className="h-6 w-6 text-accent animate-pulse" />
              <h3 className="text-lg font-bold">Sign in with GitHub</h3>
            </div>
            <p className="text-xs text-white/60">Authorize AlignAV to access your GitHub account</p>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSocialLogin('GitHub', 'Alex Rivera', 'alex-rivera@github.com')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-left text-sm cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent">A</div>
                <div>
                  <p className="font-semibold">alex-rivera</p>
                  <p className="text-xs text-white/40">alex-rivera@github.com</p>
                </div>
              </button>
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 block">Or use a custom account</label>
                <input
                  type="text"
                  placeholder="GitHub Username"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-accent"
                />
                <input
                  type="email"
                  placeholder="Primary Email Address"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full h-9 rounded-lg bg-white/5 border border-white/10 px-3 text-xs text-white focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => handleSocialLogin('GitHub', customName, customEmail)}
                  disabled={!customName || !customEmail}
                  className="w-full h-9 rounded-lg bg-accent text-white font-semibold text-xs hover:bg-accent-hover disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Authorize AlignAV
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setShowGithubOAuth(false); setCustomName(''); setCustomEmail(''); }}
              className="w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors mt-2 cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
