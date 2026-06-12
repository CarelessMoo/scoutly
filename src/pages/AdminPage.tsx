import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { demoLeads, searchHistory } from '../lib/mockData'
import { useAuth } from '../providers/AuthProvider'

export function AdminPage() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/app" replace />

  const totalSearches = searchHistory.length
  const totalCredits = searchHistory.reduce((sum, item) => sum + item.creditsUsed, 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Platform usage overview.</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total users" value="128" />
        <Metric label="Active subscriptions" value="94" />
        <Metric label="Total searches" value={totalSearches.toString()} />
        <Metric label="Credits used" value={totalCredits.toString()} />
        <Metric label="Estimated API usage" value={`${demoLeads.length * totalSearches} calls`} />
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-white">Recent signups</h2></CardHeader>
        <CardContent className="space-y-3">
          {['morgan@northstar.studio', 'alex@rankboost.io', 'admin@scoutly.app', 'taylor@localgrowth.co'].map((email, index) => (
            <div key={email} className="flex items-center justify-between rounded-lg bg-white/[0.035] p-4">
              <div>
                <p className="font-medium text-white">{email}</p>
                <p className="text-sm text-slate-500">Signed up {index + 1} day{index === 0 ? '' : 's'} ago</p>
              </div>
              <Badge>{index === 2 ? 'Admin' : 'Customer'}</Badge>
            </div>
          ))}
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
