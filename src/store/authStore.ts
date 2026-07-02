import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { loginApi, registerApi, verifyOtpApi, resendOtpApi, googleAuthApi, githubAuthApi } from '@/services/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  pendingEmail: string | null
  splashDone: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (name: string, email: string, token: string) => Promise<void>
  loginWithGithub: (name: string, email: string, token: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  verifyOtp: (code: string) => Promise<void>
  resendOtp: (email: string) => Promise<void>
  logout: () => void
  setSplashDone: () => void
  setPendingEmail: (email: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      pendingEmail: null,
      splashDone: false,
      login: async (email, password) => {
        const res = await loginApi(email, password)
        set({ user: res.user, token: res.token, isAuthenticated: true })
      },
      loginWithGoogle: async (name, email, token) => {
        const res = await googleAuthApi(name, email, token)
        set({ user: res.user, token: res.token, isAuthenticated: true })
      },
      loginWithGithub: async (name, email, token) => {
        const res = await githubAuthApi(name, email, token)
        set({ user: res.user, token: res.token, isAuthenticated: true })
      },
      register: async (name, email, password) => {
        await registerApi(name, email, password)
        set({ pendingEmail: email })
      },
      verifyOtp: async (code) => {
        const email = get().pendingEmail
        if (!email) throw new Error('No pending verification')
        const res = await verifyOtpApi(email, code)
        if ('token' in res && res.token) {
          set({ user: res.user as User, token: res.token, isAuthenticated: true, pendingEmail: null })
        } else {
          set({ pendingEmail: null })
        }
      },
      resendOtp: async (email) => {
        await resendOtpApi(email)
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setSplashDone: () => set({ splashDone: true }),
      setPendingEmail: (email) => set({ pendingEmail: email }),
    }),
    { name: 'iot-auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated, splashDone: s.splashDone }) },
  ),
)
