import { CalendarClock, Download, Search, Star, Table2, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { demoLeads, searchHistory } from '../lib/mockData'
import { useAuth } from '../providers/AuthProvider'
import { formatNumber } from '../lib/utils'
import { Badge } from '../components/ui/badge'
import { plans } from '../lib/plans'

export function DashboardPage() {
  const { remainingCredits, plan, user } = useAuth()
  const savedCount = demoLeads.length
  const upcoming = demoLeads.filter((lead) => lead.followUpDate).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Dashboard</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-white">Find, score, and follow up with better local leads.</h1>
            {plan === 'founding' && <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Founding Member • Lifetime Pricing</Badge>}
          </div>
          <p className="mt-2 text-sm text-slate-500">{user?.email ?? 'Scoutly user'} · {plan ? plans[plan].name : 'No plan'}</p>
          {plan === 'founding' && <p className="mt-2 text-sm text-cyan-100">You have locked in lifetime Founding Member pricing.</p>}
        </div>
        <Button asChild>
          <Link to="/app/search"><Search className="h-4 w-4" /> New search</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Remaining lead credits', value: formatNumber(remainingCredits), icon: Star },
          { label: 'Total saved leads', value: savedCount.toString(), icon: Table2 },
          { label: 'Upcoming follow-ups', value: upcoming.toString(), icon: CalendarClock },
          { label: 'Pipeline value', value: '5 active', icon: Workflow },
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
          <Input placeholder="Quick search: plumbers in Tampa, FL" />
          <Button asChild className="lg:w-44"><Link to="/app/search">Search leads</Link></Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">Recent searches</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchHistory.map((search) => (
              <div key={search.id} className="flex items-center justify-between rounded-lg bg-white/[0.035] p-4">
                <div>
                  <p className="font-medium text-white">{search.keyword}</p>
                  <p className="text-sm text-slate-500">{search.city}, {search.state} - {search.resultCount} leads</p>
                </div>
                <Button variant="ghost" size="sm">Rerun</Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">Pipeline overview</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {['New', 'Contacted', 'Interested', 'Follow-up', 'Closed'].map((status) => {
              const count = demoLeads.filter((lead) => lead.status === status).length
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{status}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${Math.max(12, count * 25)}%` }} />
                  </div>
                </div>
              )
            })}
            <Button variant="secondary" className="mt-3 w-full"><Download className="h-4 w-4" /> Export snapshot</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
