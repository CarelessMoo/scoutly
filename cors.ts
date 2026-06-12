import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LeadTable } from '../components/leads/LeadTable'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { Input } from '../components/ui/input'
import { demoLeads } from '../lib/mockData'
import { exportLeadsCsv } from '../lib/exportCsv'

export function SavedLeadsPage() {
  const [query, setQuery] = useState('')
  const leads = useMemo(
    () => demoLeads.filter((lead) => `${lead.businessName} ${lead.category} ${lead.city} ${lead.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Saved Leads</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Your qualified local prospects.</h1>
        </div>
        <Button variant="secondary" onClick={() => exportLeadsCsv(leads, 'scoutly-saved-leads.csv')}>
          <Download className="h-4 w-4" />
          Export saved leads
        </Button>
      </div>
      <Card>
        <CardContent>
          <Input placeholder="Search saved leads by name, category, city, or tag" value={query} onChange={(event) => setQuery(event.target.value)} />
        </CardContent>
      </Card>
      {leads.length ? (
        <Card>
          <CardHeader><h2 className="font-semibold text-white">{leads.length} saved leads</h2></CardHeader>
          <CardContent className="p-0"><LeadTable leads={leads} compact /></CardContent>
        </Card>
      ) : (
        <EmptyState icon={Search} title="No saved leads match that search" description="Clear the filter or run a new lead search to save more prospects." />
      )}
    </div>
  )
}
