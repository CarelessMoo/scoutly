import { CalendarDays, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { calendarEvents, demoLeads } from '../lib/mockData'
import { formatDate } from '../lib/utils'

export function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Calendar</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Follow-ups, calls, and meetings tied to leads.</h1>
        </div>
        <Button><CalendarDays className="h-4 w-4" /> New event</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><h2 className="font-semibold text-white">Upcoming reminders</h2></CardHeader>
          <CardContent className="space-y-3">
            {calendarEvents.map((event) => {
              const lead = demoLeads.find((item) => item.id === event.leadId)
              return (
                <div key={event.id} className="rounded-lg bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge>{event.type}</Badge>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" /> {new Date(event.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <p className="mt-3 font-medium text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{lead?.businessName} · {formatDate(event.startsAt)}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold text-white">Week view</h2></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-7">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="min-h-48 rounded-lg border border-white/10 bg-slate-950/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Day {index + 1}</p>
                  {index < calendarEvents.length && (
                    <div className="mt-4 rounded-lg bg-cyan-300/10 p-3 text-xs text-cyan-100">
                      {calendarEvents[index].title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
