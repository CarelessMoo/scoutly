import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { demoLeads } from '../lib/mockData'
import type { Lead, LeadStatus } from '../lib/types'
import { exportLeadsCsv } from '../lib/exportCsv'

const statuses: LeadStatus[] = ['New', 'Contacted', 'Interested', 'Follow-up', 'Closed', 'Not Interested']

export function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>(demoLeads)
  const [query, setQuery] = useState('')

  const visibleLeads = leads.filter((lead) => lead.businessName.toLowerCase().includes(query.toLowerCase()))

  function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : null
    if (!overId || !statuses.includes(overId as LeadStatus)) return
    setLeads((current) => current.map((lead) => (lead.id === activeId ? { ...lead, status: overId as LeadStatus } : lead)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Pipeline</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Move leads from new prospect to closed deal.</h1>
        </div>
        <Button variant="secondary" onClick={() => exportLeadsCsv(visibleLeads, 'scoutly-pipeline-leads.csv')}>
          <Download className="h-4 w-4" />
          Export pipeline
        </Button>
      </div>
      <Card className="p-4">
        <Input placeholder="Search pipeline leads" value={query} onChange={(event) => setQuery(event.target.value)} />
      </Card>
      <DndContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 xl:grid-cols-6">
          {statuses.map((status) => (
            <PipelineColumn key={status} status={status} leads={visibleLeads.filter((lead) => lead.status === status)} />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

function PipelineColumn({ status, leads }: { status: LeadStatus; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-96 rounded-lg border p-3 transition ${
        isOver ? 'border-cyan-300/50 bg-cyan-300/[0.06]' : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{status}</h2>
        <Badge>{leads.length}</Badge>
      </div>
      <div className="space-y-3">
        {leads.map((lead) => (
          <PipelineCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}

function PipelineCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`rounded-lg border border-white/10 bg-slate-950 p-3 shadow-xl shadow-black/20 ${isDragging ? 'z-20 opacity-70' : ''}`}
      {...listeners}
      {...attributes}
    >
      <p className="font-medium text-white">{lead.businessName}</p>
      <p className="mt-1 text-xs text-slate-500">{lead.category} · {lead.city}, {lead.state}</p>
      <div className="mt-3 flex items-center justify-between">
        <Badge className="text-cyan-200">Score {lead.leadScore}</Badge>
        <Search className="h-4 w-4 text-slate-600" />
      </div>
      <p className="mt-3 line-clamp-2 text-xs text-slate-400">{lead.notes}</p>
    </div>
  )
}
