import type { LucideIcon } from 'lucide-react'
import { Button } from './button'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  action?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, action, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
      <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.06] p-3 text-cyan-200">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {action && <Button className="mt-5" variant="secondary" onClick={onAction}>{action}</Button>}
    </div>
  )
}
