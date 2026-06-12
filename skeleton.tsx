import { Link } from 'react-router-dom'

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Scoutly helps paid teams find and organize local business leads.</p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/terms" className="hover:text-white">Terms</Link>
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
          <Link to="/refunds" className="hover:text-white">Refunds</Link>
        </nav>
      </div>
    </footer>
  )
}
