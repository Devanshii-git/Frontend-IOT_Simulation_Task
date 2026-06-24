import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { Cpu } from 'lucide-react'

export function OtpPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const verifyOtp = useAuthStore((s) => s.verifyOtp)
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

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors items-center justify-center px-6 select-none">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Verify your email</h2>
          <p className="text-sm text-slate-500 font-medium">
            We sent a 6-digit code to <strong className="text-slate-900 dark:text-white">{pendingEmail ?? 'your email'}</strong>
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
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
                className="h-12 w-10 rounded-md border border-slate-200 text-center text-lg font-bold dark:border-slate-800 dark:bg-slate-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 sm:h-14 sm:w-12 transition-all shadow-sm"
              />
            ))}
          </div>
          
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          
          <Button type="submit" className="w-full h-11" loading={loading}>
            Verify
          </Button>
        </form>

        <p className="text-sm text-slate-500 font-medium">
          {resendTimer > 0 ? (
            <>Resend code in <strong className="text-slate-900 dark:text-white">{resendTimer}s</strong></>
          ) : (
            <button className="font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => setResendTimer(60)}>
              Resend code
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
