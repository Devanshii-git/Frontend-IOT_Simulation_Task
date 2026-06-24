import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

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
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold">Verify your email</h2>
        <p className="mt-2 text-sm text-slate-500">
          We sent a 6-digit code to <strong>{pendingEmail ?? 'your email'}</strong>
        </p>
        <p className="mt-1 text-xs text-slate-400">Hint: use code 123456</p>

        <form onSubmit={handleSubmit} className="mt-8">
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
                className="h-12 w-10 rounded-lg border border-border-light text-center text-lg font-semibold dark:border-border-dark dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:h-14 sm:w-12"
              />
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <Button type="submit" className="mt-6 w-full" loading={loading}>Verify</Button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          {resendTimer > 0 ? (
            <>Resend code in <strong>{resendTimer}s</strong></>
          ) : (
            <button className="text-primary-600 hover:underline" onClick={() => setResendTimer(60)}>Resend code</button>
          )}
        </p>
      </div>
    </div>
  )
}
