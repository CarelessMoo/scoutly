import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { useAuth } from '../../providers/AuthProvider'

export function MarketingNav() {
  const { user, loading } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300 font-black text-slate-950">S</span>
          <span className="font-semibold text-white">Scoutly</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
          <a href="/#benefits" className="hover:text-white">Benefits</a>
          <Link to="/pricing" className="hover:text-white">Pricing</Link>
          {!loading && (user ? <Link to="/app" className="hover:text-white">Dashboard</Link> : <Link to="/login" className="hover:text-white">Login</Link>)}
        </nav>
        {!loading && (
          <Button asChild size="sm">
            <Link to={user ? '/app' : '/signup'}>{user ? 'Dashboard' : 'Get Started'}</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
