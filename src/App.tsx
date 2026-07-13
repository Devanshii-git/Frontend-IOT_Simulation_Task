import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { SplashScreen } from '@/pages/auth/SplashScreen'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const OtpPage = lazy(() => import('@/pages/auth/OtpPage').then(m => ({ default: m.OtpPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const DevicesPage = lazy(() => import('@/pages/DevicesPage').then(m => ({ default: m.DevicesPage })))
const DeviceDetailPage = lazy(() => import('@/pages/DeviceDetailPage').then(m => ({ default: m.DeviceDetailPage })))
const MonitoringPage = lazy(() => import('@/pages/MonitoringPage').then(m => ({ default: m.MonitoringPage })))
const AlertsPage = lazy(() => import('@/pages/AlertsPage').then(m => ({ default: m.AlertsPage })))
const SimulationPage = lazy(() => import('@/pages/SimulationPage').then(m => ({ default: m.SimulationPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="text-sm font-semibold text-text-muted">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dark = useThemeStore((s) => s.dark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return <>{children}</>
}

function SplashGate({ children }: { children: React.ReactNode }) {
  const splashDone = useAuthStore((s) => s.splashDone)
  const location = useLocation()
  if (!splashDone && location.pathname !== '/splash') {
    return <Navigate to="/splash" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SplashGate>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/verify-otp" element={<PublicRoute><OtpPage /></PublicRoute>} />
              <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/devices" element={<ProtectedRoute><DevicesPage /></ProtectedRoute>} />
              <Route path="/devices/:id" element={<ProtectedRoute><DeviceDetailPage /></ProtectedRoute>} />
              <Route path="/monitoring" element={<ProtectedRoute><MonitoringPage /></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
              <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/splash" replace />} />
            </Routes>
          </Suspense>
        </SplashGate>
      </BrowserRouter>
    </ThemeProvider>
  )
}
