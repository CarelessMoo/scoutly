import { ExternalLink, Save } from 'lucide-react'
import type { Lead } from '../../lib/types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

type LeadTableProps = {
  leads: Lead[]
  onSave?: (lead: Lead) => void
  compact?: boolean
}

export function LeadTable({ leads, onSave, compact }: LeadTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Score</th>
              {!compact && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {leads.map((lead) => (
              <tr key={lead.id} className="bg-slate-950/40 transition hover:bg-white/[0.035]">
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{lead.businessName}</p>
                  <p className="mt-1 text-xs text-slate-500">{lead.phoneNumber} · {lead.address}</p>
                </td>
                <td className="px-4 py-4">
                  {lead.website ? (
                    <a className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100" href={lead.website} target="_blank" rel="noreferrer">
                      Website <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Badge className="border-amber-300/20 bg-amber-300/10 text-amber-200">No website</Badge>
                  )}
                </td>
                <td className="px-4 py-4 text-slate-300">{lead.rating} · {lead.reviewCount} reviews</td>
                <td className="px-4 py-4 text-slate-300">{lead.category}</td>
                <td className="px-4 py-4 text-slate-300">{lead.city}, {lead.state}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 font-semibold text-cyan-200">{lead.leadScore}</span>
                  <p className="mt-2 max-w-44 text-xs text-slate-500">{lead.scoreReasons.slice(0, 3).join(', ')}</p>
                </td>
                {!compact && (
                  <td className="px-4 py-4">
                    <Button size="sm" variant="secondary" onClick={() => onSave?.(lead)}>
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
