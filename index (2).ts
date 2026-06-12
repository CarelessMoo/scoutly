import { Link } from 'react-router-dom'
import { Download, Search, Star, Table2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

const steps = [
  { icon: Search, title: 'Run a focused search', copy: 'Choose an industry, keyword, city, state, and radius. Scoutly uses the official Google Places API from the backend.' },
  { icon: Star, title: 'Understand credits', copy: 'Searches are free. Each newly unlocked lead costs 1 credit, and previously unlocked leads never cost credits again.' },
  { icon: Table2, title: 'Save qualified leads', copy: 'Save prospects, add notes and tags, schedule follow-ups, and move them through the pipeline.' },
  { icon: Download, title: 'Export clean CSVs', copy: 'Download search results, saved leads, or pipeline leads with consistent columns for outreach workflows.' },
]

export function OnboardingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Welcome to Scoutly</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Find local businesses that need your services.</h1>
        <p className="mt-3 max-w-2xl text-slate-400">This quick setup explains the core workflow before your first paid search.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardContent>
              <step.icon className="h-6 w-6 text-cyan-200" />
              <h2 className="mt-4 font-semibold text-white">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{step.copy}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild><Link to="/app/search">Start searching</Link></Button>
        <Button asChild variant="secondary"><Link to="/app">Go to dashboard</Link></Button>
      </div>
    </div>
  )
}
