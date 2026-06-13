import { useMemo } from 'react'
import { useAuth } from '../providers/AuthProvider'

const billingPath = '/app/billing'

export function useSubscriptionAccess(pathname: string) {
  const auth = useAuth()

  return useMemo(() => {
    const isBilling = pathname === billingPath
    const isOnboarding = pathname === '/app/onboarding'
    const isChecking = auth.loading || !auth.hasLoadedAccount

    if (isChecking) {
      return { ...auth, decision: 'loading' as const, isBilling, isOnboarding }
    }

    if (!auth.user) {
      return { ...auth, decision: 'login' as const, isBilling, isOnboarding }
    }

    if (!auth.isSubscribed) {
      return { ...auth, decision: isBilling ? 'allow' as const : 'pricing' as const, isBilling, isOnboarding }
    }

    if (!auth.onboardingCompleted && !isOnboarding && !isBilling) {
      return { ...auth, decision: 'onboarding' as const, isBilling, isOnboarding }
    }

    return { ...auth, decision: 'allow' as const, isBilling, isOnboarding }
  }, [auth, pathname])
}
