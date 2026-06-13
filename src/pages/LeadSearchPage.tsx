import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Download, Filter, Search } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { LeadTable } from '../components/leads/LeadTable'
import { demoLeads } from '../lib/mockData'
import type { Lead } from '../lib/types'
import { exportLeadsCsv } from '../lib/exportCsv'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'
import { plans } from '../lib/plans'

export function LeadSearchPage() {
  const { remainingCredits, plan } = useAuth()
  const { toast } = useToast()
  const [searched, setSearched] = useState(false)
  const [noWebsiteOnly, setNoWebsiteOnly] = useState(true)
  const [minRating, setMinRating] = useState(0)
  const [minReviews, setMinReviews] = useState(0)
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [category, setCategory] = useState('')
  const activePlan = plan ? plans[plan] : plans.founding
  const searchesToday = 1
  const searchesThisMonth = 3

  const filteredLeads = useMemo(() => {
    return demoLeads.filter((lead) => {
      if (noWebsiteOnly && lead.website) return false
      if (minRating && lead.rating < minRating) return false
      if (minReviews && lead.reviewCount < minReviews) return false
      if (city && !lead.city.toLowerCase().includes(city.toLowerCase())) return false
      if (state && !lead.state.toLowerCase().includes(state.toLowerCase())) return false
      if (category && !lead.category.toLowerCase().includes(category.toLowerCase())) return false
      return true
    })
  }, [category, city, minRating, minReviews, noWebsiteOnly, state])

  function runSearch(event: FormEvent) {
    event.preventDefault()
    if (searchesToday >= activePlan.dailySearchLimit) {
      toast({ title: 'Daily search limit reached', description: `Your ${activePlan.name} plan allows ${activePlan.dailySearchLimit} searches per day.` })
      return
    }
    if (searchesThisMonth >= activePlan.monthlySearchLimit) {
      toast({ title: 'Monthly search limit reached', description: `Your ${activePlan.name} plan allows ${activePlan.monthlySearchLimit.toLocaleString()} searches per month.` })
      return
    }
    setSearched(true)
    toast({ title: 'Search complete', description: `${filteredLeads.length} leads found. Searches are free; credits are only used when new leads are unlocked.` })
  }

  function saveLead(lead: Lead) {
    toast({ title: 'Lead saved', description: `${lead.businessName} was added to Saved Leads.` })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Lead Search</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Search local businesses and unlock the leads you want.</h1>
          <p className="mt-2 text-sm text-slate-400">Production searches call the backend Google Places function so API keys never reach the browser.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{remainingCredits.toLocaleString()} credits available</Badge>
          <Badge>{searchesToday}/{activePlan.dailySearchLimit} searches today</Badge>
          <Badge>{searchesThisMonth}/{activePlan.monthlySearchLimit} this month</Badge>
        </div>
      </div>

      <Card>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6" onSubmit={runSearch}>
            <Input placeholder="Business type" />
            <Input placeholder="Industry" />
            <Input placeholder="Keyword" />
            <Input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
            <Input placeholder="State" value={state} onChange={(event) => setState(event.target.value)} />
            <Input placeholder="Radius (mi)" type="number" defaultValue={25} min={1} max={50} />
            <Button className="md:col-span-2 xl:col-span-6">
              <Search className="h-4 w-4" />
              Run search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-white">Filters</h2>
            <p className="mt-1 text-sm text-slate-500">Refine displayed Google Places results before saving or exporting.</p>
          </div>
          <Filter className="h-5 w-5 text-slate-500" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-300">
            <input type="checkbox" checked={noWebsiteOnly} onChange={(event) => setNoWebsiteOnly(event.target.checked)} />
            No website only
          </label>
          <Input placeholder="Minimum rating" type="number" step="0.1" min="0" max="5" value={minRating || ''} onChange={(event) => setMinRating(Number(event.target.value))} />
          <Input placeholder="Minimum reviews" type="number" min="0" value={minReviews || ''} onChange={(event) => setMinReviews(Number(event.target.value))} />
          <Input placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
          <Button variant="secondary" onClick={() => exportLeadsCsv(filteredLeads, 'scoutly-search-results.csv')}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">{searched ? `${filteredLeads.length} search results` : 'Demo search results'}</h2>
          <p className="mt-1 text-sm text-slate-500">Searches, summaries, saving leads, CSV exports, pipeline, and calendar usage are free. New unlocked leads cost 1 credit each.</p>
        </CardHeader>
        <CardContent className="p-0">
          <LeadTable leads={filteredLeads} onSave={saveLead} />
        </CardContent>
      </Card>
    </div>
  )
}
