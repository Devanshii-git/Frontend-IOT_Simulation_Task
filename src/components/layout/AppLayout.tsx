import {
  Home, Cpu, Activity, Bell, FlaskConical, Settings, Search, X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useAlertStore } from '@/store/alertStore'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/devices', icon: Cpu, label: 'Devices' },
  { to: '/monitoring', icon: Activity, label: 'Monitoring' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/simulation', icon: FlaskConical, label: 'Simulation' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar({ collapsed }: { collapsed?: boolean }) {
  const location = useLocation()
  const alertCount = useAlertStore((s) => s.alerts.filter((a) => !a.acknowledged).length)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border-light dark:border-border-dark bg-white dark:bg-slate-900',
        collapsed ? 'w-16' : 'w-56',
        'h-[calc(100vh-64px)] sticky top-16',
      )}
    >
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                active
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && to === '/alerts' && alertCount > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{alertCount}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export function BottomNav() {
  const location = useLocation()
  const mainItems = navItems.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border-light bg-white dark:border-border-dark dark:bg-slate-900 md:hidden">
      {mainItems.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px]',
              active ? 'text-primary-600' : 'text-slate-500',
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const alertCount = useAlertStore((s) => s.alerts.filter((a) => !a.acknowledged).length)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border-light bg-white px-4 dark:border-border-dark dark:bg-slate-900">
      <Link to="/" className="items-center gap-2 shrink-0 flex flex-row justify-start">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <Cpu className="h-4 w-4 text-white" />
        </div>
        <span className="hidden font-semibold sm:inline">IoT Sim</span>
      </Link>

      <div className="hidden flex-1 max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search devices, alerts..."
            className="h-10 w-full rounded-lg border border-border-light bg-slate-50 pl-10 pr-4 text-sm dark:border-border-dark dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>


      <div className="relative flex flex-row items-center gap-2">
        <button
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>

        <Link to="/alerts" className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {alertCount}
            </span>
          )}
        </Link>

        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300 min-h-[44px] min-w-[44px]"
        >
          {user?.name?.charAt(0) ?? 'U'}
        </button>
        {profileOpen && (
          <>
            <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
            <div className="absolute right-0 top-12 w-48 rounded-xl border border-border-light bg-white py-1 shadow-lg dark:border-border-dark dark:bg-slate-900">
              <div className="border-b border-border-light px-4 py-2 dark:border-border-dark">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setProfileOpen(false)}>
                Settings
              </Link>
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={logout}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar collapsed={isTablet} />
        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-4 lg:p-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
