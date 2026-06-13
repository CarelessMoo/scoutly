import { type ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Skeleton } from '../ui/skeleton'
import { Card, CardContent } from '../ui/card'
import { confirmCheckoutSession } from '../../lib/api'
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const access = useSubscriptionAccess(location.pathname)
  const [checkoutPolling, setCheckoutPolling] = useState(false)
  const [checkoutTimedOut, setCheckoutTimedOut] = useState(false)
  const [routeChecking, setRouteChecking] = useState(false)
  const params = new URLSearchParams(location.search)
  const isReturningFromCheckout = params.get('checkout') === 'success'
  const checkoutSessionId = params.get('session_id')

  useEffect(() => {
    if (!access.user || !isReturningFromCheckout || access.isSubscribed) return

    let cancelled = false
    setCheckoutPolling(true)
    setCheckoutTimedOut(false)

    async function pollSubscription() {
      if (checkoutSessionId) {
        try {
          const confirmation = await confirmCheckoutSession(checkoutSessionId)
          if (confirmation.active) {
            await access.refreshSubscription()
            setCheckoutPolling(false)
            return
          }
        } catch {
          // Fall back to webhook polling below.
        }
      }

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const active = await access.refreshSubscription()
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
  }, [access, checkoutSessionId, isReturningFromCheckout])

  useEffect(() => {
    if (access.loading || !access.user || isReturningFromCheckout) return

    let cancelled = false
    setRouteChecking(true)

    access.refreshSubscription()
      .then((active) => {
        if (import.meta.env.DEV) {
          console.info('[Scoutly auth] Route access check', {
            userId: access.user?.id,
            route: location.pathname,
            subscriptionStatus: active ? 'active' : access.subscriptionStatus,
            decision: active || location.pathname === '/app/billing' ? 'allow' : 'pricing',
          })
        }
      })
      .finally(() => {
        if (!cancelled) setRouteChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [access.loading, access.user?.id, isReturningFromCheckout, location.pathname])

  useEffect(() => {
    if (import.meta.env.DEV && !access.loading && !access.subscriptionLoading && !routeChecking) {
      console.info('[Scoutly auth] Redirect decision made', {
        userId: access.user?.id ?? null,
        route: location.pathname,
        subscriptionStatus: access.subscriptionStatus,
        decision: access.decision,
      })
    }
  }, [access.decision, access.loading, access.subscriptionLoading, access.user?.id, access.subscriptionStatus, location.pathname, routeChecking])

  if (access.loading || access.subscriptionLoading || routeChecking || access.decision === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-6 h-[70vh] w-full" />
      </div>
    )
  }

  if (!access.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!access.isSubscribed && isReturningFromCheckout && (checkoutPolling || !checkoutTimedOut)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
        <Card className="page-enter w-full max-w-md text-center">
          <CardContent>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <h1 className="text-xl font-semibold text-white">Confirming your subscription...</h1>
            <p className="mt-2 text-sm text-slate-400">Stripe is confirming your payment and Scoutly is refreshing your account access.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (access.decision === 'pricing') return <Navigate to="/pricing?notice=subscription-required" replace />
  if (access.decision === 'onboarding') return <Navigate to="/app/onboarding" replace />

  return children
}
