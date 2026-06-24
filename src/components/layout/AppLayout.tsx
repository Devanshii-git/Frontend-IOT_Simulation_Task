import {
  Home, Cpu, Activity, Bell, FlaskConical, Settings, Search, X, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { useAlertStore } from '@/store/alertStore'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
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
        'hidden md:flex flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-60',
        'h-[calc(100vh-64px)] sticky top-16',
      )}
    >
      <nav className="flex flex-col gap-1.5 p-3 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group min-h-[40px]',
                active
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/10'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-105', active ? 'text-white' : 'text-slate-500 dark:text-slate-400')} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && to === '/alerts' && alertCount > 0 && (
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs font-semibold animate-pulse", active ? "bg-white text-primary-600" : "bg-red-500 text-white")}>
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
          className="absolute right-[-14px] top-4 z-40 hidden md:flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}
    </aside>
  )
}

export function BottomNav() {
  const location = useLocation()
  const mainItems = navItems.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 md:hidden">
      {mainItems.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors',
              active ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-500 dark:text-slate-400',
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
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-slate-850/80 dark:bg-slate-900/85">
      <Link to="/" className="items-center gap-2.5 shrink-0 flex flex-row justify-start group">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 group-hover:scale-[1.03] transition-transform">
          <Cpu className="h-5 w-5 text-white" />
        </div>
        <span className="hidden font-bold tracking-tight text-lg text-slate-900 dark:text-white sm:inline">AlignAV</span>
      </Link>

      <div className="hidden flex-1 max-w-md md:block">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            placeholder="Search devices, alerts..."
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 placeholder:text-slate-400 transition-all focus:bg-white dark:focus:bg-slate-950"
          />
        </div>
      </div>

      <div className="relative flex flex-row items-center gap-3">
        <button
          className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
        </button>

        <Link to="/alerts" className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {alertCount}
            </span>
          )}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300 ring-2 ring-primary-500/10 hover:ring-primary-500/30 transition-all cursor-pointer min-h-[36px] min-w-[36px]">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-semibold text-slate-950 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-500 font-normal mt-0.5">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex w-full items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchOpen && (
        <div className="absolute left-0 right-0 top-16 z-50 border-b border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900 md:hidden animate-in slide-in-from-top duration-200">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search..."
              autoFocus
              className="h-10 w-full rounded-md border border-slate-200 pl-10 pr-4 text-sm dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      )}
    </header>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <TopNav />
      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
