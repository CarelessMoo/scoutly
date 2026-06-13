import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { MarketingNav } from '../components/marketing/MarketingNav'
import { MarketingFooter } from '../components/marketing/MarketingFooter'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { getFoundingRemainingSpots, plans } from '../lib/plans'
import type { PlanKey } from '../lib/types'
import { createCheckoutSession, getFoundingStatus } from '../lib/api'
import { useToast } from '../providers/ToastProvider'
import { useAuth } from '../providers/AuthProvider'

export function PricingPage() {
  const { toast } = useToast()
  const { user, loading, isSubscribed } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [foundingRemaining, setFoundingRemaining] = useState(getFoundingRemainingSpots())

  useEffect(() => {
    getFoundingStatus()
      .then((status) => setFoundingRemaining(status.remaining))
      .catch(() => setFoundingRemaining(getFoundingRemainingSpots()))
  }, [])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
        <Card className="page-enter w-full max-w-md text-center">
          <CardContent>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <h1 className="text-xl font-semibold text-white">Restoring your Scoutly session</h1>
            <p className="mt-2 text-sm text-slate-400">Checking whether your subscription is already active.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubscribed) return <Navigate to="/app" replace />

  async function startCheckout(plan: PlanKey) {
    if (plan === 'founding' && foundingRemaining === 0) {
      toast({ title: 'Founding Member Plan Sold Out', description: 'Once all 25 spots are claimed, this offer will never return.' })
      return
    }

    if (!user) {
      window.localStorage.setItem('scoutly_pending_plan', plan)
      toast({ title: 'Create your account first', description: 'After signup, Scoutly will send you to Stripe Checkout for this plan.' })
      navigate('/signup')
      return
    }

    try {
      const { url } = await createCheckoutSession(plan)
      window.location.href = url
    } catch (error) {
      toast({
        title: 'Checkout could not start',
        description: error instanceof Error ? error.message : 'Check Supabase Function Secrets and Stripe price IDs.',
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
          <p className="mt-2 text-sm text-slate-500">Pay just $19/month for life and receive 2,000 monthly lead credits. Once all 25 spots are claimed, this offer will never return.</p>
        </div>
        {searchParams.get('notice') === 'subscription-required' && (
          <div className="mx-auto mt-8 max-w-3xl rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-center text-sm text-cyan-100">
            An active Scoutly subscription is required to access this feature.
          </div>
        )}
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
