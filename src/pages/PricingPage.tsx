import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { MarketingNav } from '../components/marketing/MarketingNav'
import { MarketingFooter } from '../components/marketing/MarketingFooter'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { getFoundingRemainingSpots, plans } from '../lib/plans'
import type { PlanKey } from '../lib/types'
import { createCheckoutSession, getFoundingStatus } from '../lib/api'
import { useToast } from '../providers/ToastProvider'

export function PricingPage() {
  const { toast } = useToast()
  const [foundingRemaining, setFoundingRemaining] = useState(getFoundingRemainingSpots())

  useEffect(() => {
    getFoundingStatus()
      .then((status) => setFoundingRemaining(status.remaining))
      .catch(() => setFoundingRemaining(getFoundingRemainingSpots()))
  }, [])

  async function startCheckout(plan: PlanKey) {
    if (plan === 'founding' && foundingRemaining === 0) {
      toast({ title: 'Founding Member Plan Sold Out', description: 'Once all 25 spots are claimed, this plan will never be available again.' })
      return
    }

    try {
      const { url } = await createCheckoutSession(plan)
      window.location.href = url
    } catch {
      toast({
        title: 'Checkout is ready to connect',
        description: 'Add Supabase and Stripe environment variables, then this button opens Stripe Checkout.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <MarketingNav />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">No free plan</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Choose the lead engine that fits your outreach volume.</h1>
          <p className="mt-4 text-slate-400">Become one of Scoutly's first 25 Founding Members and lock in lifetime pricing forever.</p>
          <p className="mt-2 text-sm text-slate-500">Once all 25 spots are claimed, this plan will never be available again.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {(Object.keys(plans) as PlanKey[]).map((key) => {
            const plan = plans[key]
            const isFoundingSoldOut = key === 'founding' && foundingRemaining === 0
            return (
              <Card key={key} className={key === 'founding' ? 'border-cyan-300/40 bg-cyan-300/[0.05]' : key === 'pro' ? 'border-white/20' : undefined}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
                    {plan.badge && <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-xs font-semibold text-slate-950">{plan.badge}</span>}
                    {key === 'pro' && <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">Popular</span>}
                  </div>
                  <p className="mt-5 text-4xl font-semibold text-white">${plan.price}<span className="text-base font-normal text-slate-500">/month</span></p>
                  <p className="mt-2 text-sm text-slate-400">{plan.credits.toLocaleString()} lead credits/month</p>
                  <p className="mt-1 text-xs text-slate-500">{plan.dailySearchLimit} daily searches · {plan.monthlySearchLimit.toLocaleString()} monthly searches</p>
                  {key === 'founding' && (
                    <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100">
                      {isFoundingSoldOut ? 'Founding Member Plan Sold Out' : `Only ${foundingRemaining} of 25 spots remaining`}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 text-cyan-200" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" onClick={() => startCheckout(key)} disabled={isFoundingSoldOut}>
                    {isFoundingSoldOut ? 'Sold Out' : 'Get Access'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          Already subscribed? <Link to="/login" className="text-cyan-200 hover:text-cyan-100">Log in</Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  )
}
