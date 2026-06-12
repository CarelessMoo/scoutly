import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CalendarDays, CreditCard, History, LayoutDashboard, LogOut, Search, Settings, Shield, Table2, Workflow } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useAuth } from '../../providers/AuthProvider'
import { formatNumber } from '../../lib/utils'
import { plans } from '../../lib/plans'

const navItems = [
  { label: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { label: 'Search Leads', href: '/app/search', icon: Search },
  { label: 'Saved Leads', href: '/app/saved', icon: Table2 },
  { label: 'Pipeline', href: '/app/pipeline', icon: Workflow },
  { label: 'Calendar', href: '/app/calendar', icon: CalendarDays },
  { label: 'Credit History', href: '/app/credits', icon: History },
  { label: 'Billing', href: '/app/billing', icon: CreditCard },
  { label: 'Settings', href: '/app/settings', icon: Settings },
]

export function AppShell() {
  const { remainingCredits, plan, signOut, isAdmin, user } = useAuth()
  const navigate = useNavigate()
  const visibleNavItems = isAdmin ? [...navItems, { label: 'Admin', href: '/app/admin', icon: Shield }] : navItems

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-slate-950/95 p-4 lg:block">
        <NavLink to="/" className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300 font-black text-slate-950">S</div>
          <div>
            <p className="font-semibold text-white">Scoutly</p>
            <p className="text-xs text-slate-500">Lead generation OS</p>
          </div>
        </NavLink>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credits</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(remainingCredits)}</p>
          <p className="text-sm text-slate-400">{plan ? plans[plan].name : 'No plan'}</p>
          {plan === 'founding' && <Badge className="mt-3 border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Founding Member • Lifetime Pricing</Badge>}
          {user?.email && <p className="mt-3 truncate text-xs text-slate-500">{user.email}</p>}
        </div>

        <nav className="mt-5 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/app'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Button
          variant="ghost"
          className="absolute bottom-4 left-4 right-4 justify-start"
          onClick={() => {
            signOut()
            navigate('/')
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </aside>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <NavLink to="/app" className="flex items-center gap-2 font-semibold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300 text-slate-950">S</span>
            Scoutly
          </NavLink>
          <Badge>{formatNumber(remainingCredits)} credits</Badge>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {visibleNavItems.map((item) => (
            <NavLink key={item.href} to={item.href} end={item.href === '/app'} className="whitespace-nowrap rounded-lg bg-white/[0.05] px-3 py-2 text-xs text-slate-300">
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
