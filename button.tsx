import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Skeleton } from '../ui/skeleton'
import { useAuth } from '../../providers/AuthProvider'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, user, isSubscribed } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-6 h-[70vh] w-full" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!isSubscribed && location.pathname !== '/pricing') return <Navigate to="/pricing" replace />

  return children
}
