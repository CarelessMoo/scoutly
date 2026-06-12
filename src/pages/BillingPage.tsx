import { CreditCard, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { plans } from '../lib/plans'
import { openBillingPortal } from '../lib/api'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'

export function BillingPage() {
  const { plan, subscriptionStatus, remainingCredits } = useAuth()
  const { toast } = useToast()
  const activePlan = plan ? plans[plan] : null

  async function openPortal() {
    if (
      plan === 'founding' &&
      !window.confirm('You have locked-in Founding Member pricing. Continue to Stripe billing management only if you understand that plan changes may affect your subscription.')
    ) {
      return
    }

    try {
      const { url } = await openBillingPortal()
      window.location.href = url
    } catch {
      toast({ title: 'Billing portal is ready to connect', description: 'Once Stripe keys are configured, this opens the customer billing portal.' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Billing</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Subscription and credits.</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-semibold text-white">Current subscription</h2></CardHeader>
          <CardContent>
            <ShieldCheck className="h-8 w-8 text-cyan-200" />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-semibold text-white">{activePlan?.name ?? 'No active plan'}</p>
              {plan === 'founding' && <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">Founding Member • Lifetime Pricing</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-400">Status: {subscriptionStatus}</p>
            <p className="mt-1 text-sm text-slate-400">Monthly credits: {activePlan?.credits.toLocaleString() ?? 0}</p>
            <p className="mt-1 text-sm text-slate-400">Remaining credits: {remainingCredits.toLocaleString()}</p>
            {plan === 'founding' && (
              <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
                Your $19/month Founding Member pricing is permanently grandfathered. Confirm any plan change before continuing in Stripe.
              </div>
            )}
            <Button className="mt-6" onClick={openPortal}><CreditCard className="h-4 w-4" /> Manage billing</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold text-white">Access rules</h2></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <p>Users must have an active paid Stripe subscription before they can access Scoutly.</p>
            <p>Search requests are validated server-side and blocked when credits reach zero.</p>
            <p>Credits reset monthly based on the plan stored from Stripe webhook events.</p>
            <div className="flex flex-wrap gap-4 pt-2 text-cyan-200">
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/refunds">Refund policy</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
