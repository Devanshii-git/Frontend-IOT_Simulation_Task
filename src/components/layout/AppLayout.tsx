import {
  Home, Cpu, Activity, Bell, FlaskConical, Settings, Search, X, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useAlertStore } from '@/store/alertStore'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LightRays from '@/components/ui/LightRays'
import { GlobalSpotlight } from '@/components/ui/MagicBento'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/devices', icon: Cpu, label: 'Devices' },
  { to: '/monitoring', icon: Activity, label: 'Monitoring' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/simulation', icon: FlaskConical, label: 'Simulation' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]



export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed?: (val: boolean) => void }) {
  const location = useLocation()
  const alertCount = useAlertStore((s) => s.alerts.filter((a) => !a.acknowledged).length)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-bg-surface transition-all duration-300 relative',
        collapsed ? 'w-17' : 'w-60',
        'h-[calc(100vh-64px)] sticky top-16',
      )}
    >
      <div className="flex flex-col flex-1 p-3 sticky top-16 h-[calc(100vh-64px)] relative">
        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                title={label}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group min-h-[40px] cursor-pointer',
                  active
                    ? 'bg-accent text-white shadow-sm shadow-accent/10'
                    : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary',
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-105', active ? 'text-white' : 'text-text-muted')} />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && to === '/alerts' && alertCount > 0 && (
                  <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs font-semibold animate-pulse", active ? "bg-white text-accent" : "bg-status-error text-white")}>
                    {alertCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {setCollapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute right-[-14px] top-4 z-40 hidden md:flex h-7 w-7 items-center justify-center rounded-full border border-border bg-bg-surface shadow-sm text-text-muted hover:text-text-primary cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>
    </aside>
  )
}

export function BottomNav() {
  const location = useLocation()
  const mainItems = navItems.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-bg-surface/90 backdrop-blur-md md:hidden">
      {mainItems.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors cursor-pointer',
              active ? 'text-accent font-semibold' : 'text-text-muted',
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] tracking-wide">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false)
  const alertCount = useAlertStore((s) => s.alerts.filter((a) => !a.acknowledged).length)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/40 bg-bg-surface/60 px-4 backdrop-blur-lg">
      <Link to="/" className="items-center gap-2.5 shrink-0 flex flex-row justify-start group cursor-pointer">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent group-hover:scale-[1.03] transition-transform">
          <Cpu className="h-5 w-5 text-white" />
        </div>
        <span className="hidden font-bold tracking-tight text-lg text-text-primary sm:inline">AlignAV</span>
      </Link>

      <div className="hidden flex-1 max-w-md md:block">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
          <input
            placeholder="Search devices, alerts..."
            className="h-10 w-full rounded-md border border-border bg-bg-primary/50 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle/40 focus:border-border-accent placeholder:text-text-muted transition-all focus:bg-bg-surface"
          />
        </div>
      </div>

      <div className="relative flex flex-row items-center gap-3">
        <button
          className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-bg-elevated text-text-muted cursor-pointer"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>

        <Link to="/alerts" className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-bg-elevated text-text-muted transition-colors cursor-pointer">
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-status-error text-[10px] font-bold text-white ring-2 ring-bg-surface animate-pulse">
              {alertCount}
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent ring-2 ring-accent/10 hover:ring-accent/30 transition-all cursor-pointer min-h-[36px] min-w-[36px]">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-semibold text-text-primary">{user?.name}</p>
              <p className="text-xs text-text-muted font-normal mt-0.5">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex w-full items-center gap-2">
                <Settings className="h-4 w-4 text-text-muted" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-status-error focus:bg-status-error/10 flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchOpen && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-border bg-bg-surface p-3 shadow-lg md:hidden animate-in slide-in-from-top duration-200">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              placeholder="Search..."
              autoFocus
              className="h-10 w-full rounded-md border border-border bg-bg-primary pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle/40"
            />
          </div>
        </div>
      )}
    </header>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary transition-colors relative overflow-x-hidden">
      {/* Global spotlight for Magic Bento cards */}
      <GlobalSpotlight glowColor="132, 0, 255" spotlightRadius={400} />

      {/* LightRays background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-15">
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

      <TopNav />
      <div className="flex flex-1 min-h-0 z-10 relative">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 min-h-0 h-[calc(100vh-4rem)] overflow-y-auto p-4 pb-20 md:pb-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mx-auto max-w-7xl"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
