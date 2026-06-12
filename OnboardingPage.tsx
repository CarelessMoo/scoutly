import { UserRound } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'

export function AccountPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Account settings.</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/[0.06] p-3 text-cyan-200"><UserRound className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold text-white">Profile</h2>
              <p className="text-sm text-slate-500">Manage your workspace identity.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid max-w-2xl gap-4">
          <label className="text-sm text-slate-300">Email<Input className="mt-2" value={user?.email ?? 'demo@scoutly.com'} readOnly /></label>
          <label className="text-sm text-slate-300">Company<Input className="mt-2" placeholder="Your agency or business" /></label>
          <Button className="w-fit" onClick={() => toast({ title: 'Settings saved', description: 'Profile updates are ready to persist to Supabase.' })}>Save settings</Button>
        </CardContent>
      </Card>
    </div>
  )
}
