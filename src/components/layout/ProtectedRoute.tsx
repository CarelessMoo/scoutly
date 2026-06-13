import { type ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Skeleton } from '../ui/skeleton'
import { useAuth } from '../../providers/AuthProvider'
import { Card, CardContent } from '../ui/card'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, user, isSubscribed, refreshSubscription } = useAuth()
  const location = useLocation()
  const [checkoutPolling, setCheckoutPolling] = useState(false)
  const [checkoutTimedOut, setCheckoutTimedOut] = useState(false)
  const isReturningFromCheckout = new URLSearchParams(location.search).get('checkout') === 'success'

  useEffect(() => {
    if (!user || !isReturningFromCheckout || isSubscribed) return

    let cancelled = false
    setCheckoutPolling(true)
    setCheckoutTimedOut(false)

    async function pollSubscription() {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const active = await refreshSubscription()
        if (cancelled || active) {
          setCheckoutPolling(false)
          return
        }
        await new Promise((resolve) => window.setTimeout(resolve, 2500))
      }

      if (!cancelled) {
        setCheckoutPolling(false)
        setCheckoutTimedOut(true)
      }
    }

    pollSubscription()

    return () => {
      cancelled = true
    }
  }, [isReturningFromCheckout, isSubscribed, refreshSubscription, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-6 h-[70vh] w-full" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!isSubscribed && isReturningFromCheckout && (checkoutPolling || !checkoutTimedOut)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
        <Card className="page-enter w-full max-w-md text-center">
          <CardContent>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <h1 className="text-xl font-semibold text-white">Activating your subscription</h1>
            <p className="mt-2 text-sm text-slate-400">Stripe is confirming your payment. This usually takes a few seconds.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!isSubscribed && location.pathname !== '/pricing') return <Navigate to="/pricing" replace />

  return children
}
