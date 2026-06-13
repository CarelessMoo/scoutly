import { type ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { confirmCheckoutSession, syncSubscription } from '../../lib/api'
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess'

function AppLoadingScreen({ title = 'Loading Scoutly', description = 'Checking your account access.' }: { title?: string; description?: string }) {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto w-full max-w-7xl">
        <Skeleton className="h-16 w-full" />
        <Card className="page-enter mt-6">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-5 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CheckoutSyncTimeout({ detail }: { detail?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
      <Card className="page-enter w-full max-w-md text-center">
        <CardContent>
          <h1 className="text-xl font-semibold text-white">Your payment was received, but we are still syncing your subscription.</h1>
          <p className="mt-2 text-sm text-slate-400">Please refresh in a moment or contact support.</p>
          {detail && <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-400">{detail}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const access = useSubscriptionAccess(location.pathname)
  const params = new URLSearchParams(location.search)
  const isReturningFromCheckout = params.get('checkout') === 'success'
  const checkoutSessionId = params.get('session_id')
  const [checkoutState, setCheckoutState] = useState<'idle' | 'confirming' | 'timed-out'>(
    isReturningFromCheckout ? 'confirming' : 'idle',
  )
  const [checkoutError, setCheckoutError] = useState('')
  const [routeChecking, setRouteChecking] = useState(false)

  useEffect(() => {
    if (!isReturningFromCheckout) {
      setCheckoutState('idle')
      return
    }
    if (!access.user || access.loading || !access.hasLoadedAccount) return
    if (access.isSubscribed) {
      setCheckoutState('idle')
      return
    }

    let cancelled = false
    setCheckoutState('confirming')
    setCheckoutError('')

    async function confirmCheckout() {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const confirmation = await confirmCheckoutSession(checkoutSessionId)
          if (confirmation.active) {
            await access.refreshSubscription()
            if (!cancelled) setCheckoutState('idle')
            return
          }

          const active = await access.refreshSubscription()
          if (active) {
            if (!cancelled) setCheckoutState('idle')
            return
          }
          const synced = await syncSubscription()
          if (synced.active) {
            await access.refreshSubscription()
            if (!cancelled) setCheckoutState('idle')
            return
          }
          if (synced.reason && !cancelled) setCheckoutError(synced.reason)
        } catch (error) {
          if (!cancelled && error instanceof Error) setCheckoutError(error.message)
        }

        await new Promise((resolve) => window.setTimeout(resolve, 2500))
        if (cancelled) return
      }

      if (!cancelled) setCheckoutState('timed-out')
    }

    confirmCheckout()

    return () => {
      cancelled = true
    }
  }, [access.user?.id, access.loading, access.hasLoadedAccount, access.isSubscribed, checkoutSessionId, isReturningFromCheckout])

  useEffect(() => {
    if (access.loading || !access.hasLoadedAccount || !access.user || isReturningFromCheckout) return

    let cancelled = false
    setRouteChecking(true)

    access.refreshSubscription()
      .then(async (active) => {
        if (!active && !['active', 'trialing'].includes(access.subscriptionStatus)) {
          try {
            const synced = await syncSubscription()
            if (synced.active) await access.refreshSubscription()
          } catch {
            // If there is no Stripe subscription to repair, the normal redirect rules apply.
          }
        }
      })
      .finally(() => {
        if (!cancelled) setRouteChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [access.loading, access.hasLoadedAccount, access.user?.id, isReturningFromCheckout, location.pathname])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (access.loading || !access.hasLoadedAccount || routeChecking || checkoutState === 'confirming') return

    console.info('[Scoutly auth] Redirect decision', {
      route: location.pathname,
      userId: access.user?.id ?? null,
      authLoading: access.loading,
      subscriptionLoading: access.subscriptionLoading || routeChecking,
      subscriptionFound: access.subscriptionFound,
      subscriptionStatus: access.subscriptionStatus,
      onboardingCompleted: access.onboardingCompleted,
      decision: access.decision,
    })
  }, [
    access.decision,
    access.hasLoadedAccount,
    access.loading,
    access.onboardingCompleted,
    access.subscriptionFound,
    access.subscriptionLoading,
    access.subscriptionStatus,
    access.user?.id,
    checkoutState,
    location.pathname,
    routeChecking,
  ])

  if (access.loading || !access.hasLoadedAccount || access.decision === 'loading') {
    return <AppLoadingScreen title="Loading Scoutly" description="Restoring your session and checking account access." />
  }

  if (!access.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  if (isReturningFromCheckout && checkoutState === 'confirming') {
    return <AppLoadingScreen title="Confirming your subscription..." description="Stripe is confirming your payment and Scoutly is refreshing your account access." />
  }

  if (isReturningFromCheckout && checkoutState === 'timed-out' && !access.isSubscribed) {
    return <CheckoutSyncTimeout detail={checkoutError} />
  }

  if (routeChecking) {
    return <AppLoadingScreen title="Checking your subscription" description="Refreshing your Scoutly access before opening this page." />
  }

  if (access.decision === 'pricing') return <Navigate to="/pricing?notice=subscription-required" replace />
  if (access.decision === 'onboarding') return <Navigate to="/app/onboarding" replace />

  return children
}
