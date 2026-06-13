import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, Download, Globe2, ListChecks, MapPin, Search } from 'lucide-react'
import { MarketingNav } from '../components/marketing/MarketingNav'
import { MarketingFooter } from '../components/marketing/MarketingFooter'
import { LeadTable } from '../components/leads/LeadTable'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { plans, getFoundingRemainingSpots } from '../lib/plans'
import { demoLeads } from '../lib/mockData'
import type { PlanKey } from '../lib/types'
import { getFoundingStatus } from '../lib/api'

const benefits = [
  { icon: MapPin, title: 'Find local businesses', copy: 'Search by industry, keyword, city, state, and radius using the official Google Places API.' },
  { icon: Globe2, title: 'Spot missing websites', copy: 'Filter for businesses without websites and prioritize high-fit outreach.' },
  { icon: ListChecks, title: 'Organize outreach', copy: 'Save leads, add notes, tag opportunities, and move deals through a focused pipeline.' },
  { icon: Download, title: 'Export leads', copy: 'Download clean CSV files for search results, saved leads, and pipeline views.' },
  { icon: CalendarCheck, title: 'Manage follow-ups', copy: 'Schedule calls, meetings, and reminders directly against each saved lead.' },
]

export function LandingPage() {
  const [foundingRemaining, setFoundingRemaining] = useState(getFoundingRemainingSpots())

  useEffect(() => {
    getFoundingStatus()
      .then((status) => setFoundingRemaining(status.remaining))
      .catch(() => setFoundingRemaining(getFoundingRemainingSpots()))
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <MarketingNav />
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.16),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0),#020617_82%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-28">
            <div className="flex flex-col justify-center">
              <Badge className="w-fit border-cyan-300/20 bg-cyan-300/10 text-cyan-200">Paid local lead generation</Badge>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                Scoutly
              </h1>
              <p className="mt-4 max-w-2xl text-xl text-slate-300">Find local businesses that need your services.</p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
                Discover businesses by industry and location, identify prospects without strong web presence, and turn them into an organized outreach pipeline.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/signup">Get Started <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
            <Card className="overflow-hidden bg-slate-900/80">
              <div className="border-b border-white/10 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 flex-1 min-w-56 items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-slate-400">
                    <Search className="h-4 w-4" />
                    dentists without websites
                  </div>
                  <Badge>Chicago, IL</Badge>
                  <Badge>25 mi</Badge>
                </div>
              </div>
              <CardContent className="p-0">
                <LeadTable leads={demoLeads.slice(0, 4)} compact />
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="benefits" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Built for outreach teams</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">From search to follow-up in one paid workspace.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent>
                  <benefit.icon className="h-5 w-5 text-cyan-200" />
                  <h3 className="mt-4 font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{benefit.copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Lock in Scoutly while the first 25 spots are open.</h2>
            <p className="mt-3 text-slate-400">Become one of Scoutly's first 25 Founding Members and lock in lifetime pricing forever.</p>
            <p className="mt-2 text-sm text-slate-500">Pay just $19/month for life and receive 2,000 monthly lead credits. Once all 25 spots are claimed, this offer will never return.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {(Object.keys(plans) as PlanKey[]).map((key) => {
              const plan = plans[key]
              return (
                <Card key={key} className={key === 'founding' ? 'border-cyan-300/40 bg-cyan-300/[0.05]' : undefined}>
                  <CardContent>
                    <div className="flex min-h-14 items-start justify-between gap-3">
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      {plan.badge && <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100">{plan.badge}</Badge>}
                    </div>
                    <p className="mt-4 text-3xl font-semibold text-white">${plan.price}<span className="text-sm text-slate-500">/month</span></p>
                    <p className="mt-2 text-sm text-slate-400">{plan.credits.toLocaleString()} lead credits/month</p>
                    {key === 'founding' && (
                      <p className="mt-3 text-sm font-medium text-cyan-100">
                        {foundingRemaining === 0 ? 'Founding Member Plan Sold Out' : `Only ${foundingRemaining} of 25 spots remaining`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}
