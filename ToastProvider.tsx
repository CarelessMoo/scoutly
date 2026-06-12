import { AlertTriangle, Download } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { searchHistory } from '../lib/mockData'
import { useAuth } from '../providers/AuthProvider'
import { plans } from '../lib/plans'

export function CreditHistoryPage() {
  const { plan, remainingCredits } = useAuth()
  const activePlan = plan ? plans[plan] : plans.founding
  const usedToday = searchHistory.filter((item) => item.createdAt === '2026-06-10').length
  const usedThisMonth = searchHistory.length
  const creditsUsed = searchHistory.reduce((sum, item) => sum + item.creditsUsed, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Credit History</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Search usage, credit charges, and API limits.</h1>
        </div>
        <Button variant="secondary"><Download className="h-4 w-4" /> Export history</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Remaining credits" value={remainingCredits.toLocaleString()} />
        <Metric label="Credits used" value={creditsUsed.toLocaleString()} />
        <Metric label="Daily searches" value={`${usedToday}/${activePlan.dailySearchLimit}`} />
        <Metric label="Monthly searches" value={`${usedThisMonth}/${activePlan.monthlySearchLimit}`} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-cyan-200" />
            <div>
              <h2 className="font-semibold text-white">Cost protection</h2>
              <p className="mt-1 text-sm text-slate-400">Searches are free. Credits are only deducted when new leads are unlocked, and previously unlocked duplicate leads never cost credits again.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Radius</th>
                  <th className="px-4 py-3">Leads returned</th>
                  <th className="px-4 py-3">Credits used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {searchHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 text-slate-300">{item.createdAt}</td>
                    <td className="px-4 py-4 font-medium text-white">{item.keyword}</td>
                    <td className="px-4 py-4 text-slate-300">{item.city}, {item.state}</td>
                    <td className="px-4 py-4 text-slate-300">{item.radius} mi</td>
                    <td className="px-4 py-4 text-slate-300">{item.leadsReturned}</td>
                    <td className="px-4 py-4"><Badge>{item.creditsUsed}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="mt-1 text-sm text-slate-400">{label}</p>
      </CardContent>
    </Card>
  )
}
