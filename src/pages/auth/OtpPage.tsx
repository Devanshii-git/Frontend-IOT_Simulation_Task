import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { Cpu } from 'lucide-react'
import LightRays from '@/components/ui/LightRays'

export function OtpPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const verifyOtp = useAuthStore((s) => s.verifyOtp)
  const resendOtp = useAuthStore((s) => s.resendOtp)
  const pendingEmail = useAuthStore((s) => s.pendingEmail)
  const navigate = useNavigate()

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 6) { setError('Enter the full 6-digit code'); return }
    setLoading(true)
    setError('')
    try {
      await verifyOtp(code)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!pendingEmail) return
    setError('')
    try {
      await resendOtp(pendingEmail)
      setResendTimer(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }

  return (
    <div className="relative flex min-h-screen text-text-primary transition-colors items-center justify-center px-6 select-none overflow-hidden bg-black">
      {/* Full Page LightRays Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50 dark:opacity-20">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={0.8}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.08}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      <div className="w-full max-w-md text-center space-y-6 bg-[rgba(82,39,255,0.08)] dark:bg-[rgba(82,39,255,0.04)] backdrop-blur-xl border border-purple-500/20 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-accent/5 z-10">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Verify your email</h2>
          <p className="text-sm text-white/60 font-medium">
            We sent a 6-digit code to <strong className="text-white">{pendingEmail ?? 'your email'}</strong>
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
            Hint: use code 123456
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-md border border-white/10 text-center text-lg font-bold text-white bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-accent sm:h-14 sm:w-12 transition-all shadow-sm"
              />
            ))}
          </div>
          
          {error && <p className="text-sm font-medium text-status-error">{error}</p>}
          
          <Button type="submit" className="w-full h-11 shadow-md shadow-accent/15" loading={loading}>
            Verify
          </Button>
        </form>

        <p className="text-sm text-white/60 font-medium">
          {resendTimer > 0 ? (
            <>Resend code in <strong className="text-white">{resendTimer}s</strong></>
          ) : (
            <button className="font-semibold text-accent hover:text-accent-hover cursor-pointer" onClick={handleResend}>
              Resend code
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
