import { CalendarClock, Search, Star, Table2, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { plans } from '../lib/plans'
import { searchHistory } from '../lib/mockData'
import { formatNumber } from '../lib/utils'
import { useAuth } from '../providers/AuthProvider'

export function DashboardPage() {
  const { remainingCredits, plan, user, isSubscribed } = useAuth()
  const creditsUsedThisMonth = 0
  const nextResetDate = 'Jul 12, 2026'
  const searchLink = isSubscribed ? '/app/search' : '/pricing?notice=subscription-required'

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Dashboard</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">Find, score, and follow up with better local leads.</h1>
            {plan === 'founding' && <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Founding Member • Lifetime Pricing</Badge>}
          </div>
          <p className="mt-2 text-sm text-slate-500">{user?.email ?? 'Scoutly user'} - {plan ? plans[plan].name : 'No plan'}</p>
          {plan === 'founding' && <p className="mt-2 text-sm text-cyan-100">You have locked in lifetime Founding Member pricing.</p>}
        </div>
        <Button asChild>
          <Link to={searchLink}><Search className="h-4 w-4" /> {isSubscribed ? 'New search' : 'Upgrade to search'}</Link>
        </Button>
      </div>

      {!isSubscribed && (
        <Card className="border-cyan-300/25 bg-cyan-300/[0.06]">
          <CardContent className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-cyan-100">Demo dashboard</p>
              <p className="mt-1 text-sm text-slate-400">Upgrade to unlock real business leads. Search, CSV exports, lead unlocking, saved leads, and CRM actions are disabled until your subscription is active.</p>
            </div>
            <Button asChild>
              <Link to="/pricing">Choose a plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Remaining lead credits', value: formatNumber(remainingCredits), icon: Star },
          { label: 'Credits used this month', value: formatNumber(creditsUsedThisMonth), icon: Table2 },
          { label: 'Next credit reset', value: nextResetDate, icon: CalendarClock },
          { label: 'Active subscription plan', value: plan ? plans[plan].name : 'None', icon: Workflow },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardContent>
              <metric.icon className="h-5 w-5 text-cyan-200" />
              <p className="mt-4 text-2xl font-semibold text-white">{metric.value}</p>
              <p className="text-sm text-slate-400">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row">
          <Input placeholder={isSubscribed ? 'Quick search: plumbers in Tampa, FL' : 'Demo only: upgrade to run live Google Places searches'} disabled={!isSubscribed} />
          <Button asChild className="lg:w-44"><Link to={searchLink}>{isSubscribed ? 'Search leads' : 'Upgrade'}</Link></Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">Recent searches</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.025] p-6 text-sm text-slate-400">
                {isSubscribed ? 'No searches yet. Your launch activity will appear here after your first search.' : 'Sample search history is hidden in demo mode. Upgrade to unlock real business leads.'}
              </div>
            ) : (
              searchHistory.map((search) => (
                <div key={search.id} className="flex items-center justify-between rounded-lg bg-white/[0.035] p-4">
                  <div>
                    <p className="font-medium text-white">{search.keyword}</p>
                    <p className="text-sm text-slate-500">{search.city}, {search.state} - {search.resultCount} leads</p>
                  </div>
                  <Button variant="ghost" size="sm">Rerun</Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">Pipeline overview</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {['New', 'Contacted', 'Interested', 'Follow-up', 'Closed'].map((status) => (
              <div key={status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{status}</span>
                  <span className="text-slate-500">0</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]" />
              </div>
            ))}
            <p className="pt-2 text-sm text-slate-500">No pipeline activity yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
