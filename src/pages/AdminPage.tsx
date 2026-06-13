import { Navigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { useAuth } from '../providers/AuthProvider'

export function AdminPage() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/app" replace />

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Platform usage overview.</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total users" value="0" />
        <Metric label="Active subscriptions" value="0" />
        <Metric label="Total searches" value="0" />
        <Metric label="Credits used" value="0" />
        <Metric label="Estimated API usage" value="0 calls" />
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-white">Recent signups</h2></CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.025] p-6 text-sm text-slate-400">
            No signups yet. New customers will appear here after launch.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Paid users: 0</Badge>
            <Badge>Revenue: $0</Badge>
            <Badge>Leads unlocked: 0</Badge>
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
