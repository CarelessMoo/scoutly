import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import type { PlanKey, SubscriptionStatus } from '../lib/types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  subscriptionLoading: boolean
  fullName: string | null
  onboardingCompleted: boolean
  plan: PlanKey | null
  subscriptionStatus: SubscriptionStatus
  remainingCredits: number
  isAdmin: boolean
  isSubscribed: boolean
  hasLoadedAccount: boolean
  refreshSubscription: () => Promise<boolean>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  completeOnboarding: (preferences: { targetService: string; firstCity: string; targetIndustry: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const isLocalDemoMode = import.meta.env.DEV && !hasSupabaseConfig
const activeSubscriptionStatuses = ['active', 'trialing']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<PlanKey | null>(isLocalDemoMode ? 'founding' : null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(isLocalDemoMode ? 'active' : 'inactive')
  const [remainingCredits, setRemainingCredits] = useState(isLocalDemoMode ? 2000 : 0)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [hasLoadedAccount, setHasLoadedAccount] = useState(isLocalDemoMode)
  const [fullName, setFullName] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState(isLocalDemoMode)

  const clearAccountState = useCallback(() => {
    setPlan(null)
    setSubscriptionStatus('inactive')
    setRemainingCredits(0)
    setFullName(null)
    setOnboardingCompleted(false)
    setHasLoadedAccount(true)
  }, [])

  const loadAccountState = useCallback(async (accountUser: User | null) => {
    if (isLocalDemoMode) {
      setHasLoadedAccount(true)
      return true
    }
    if (!supabase || !accountUser) {
      clearAccountState()
      return false
    }

    setSubscriptionLoading(true)
    setHasLoadedAccount(false)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, onboarding_completed')
        .eq('id', accountUser.id)
        .maybeSingle()

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', accountUser.id)
        .maybeSingle()

      const { data: credits } = await supabase
        .from('usage_credits')
        .select('remaining_credits')
        .eq('user_id', accountUser.id)
        .maybeSingle()

      setFullName(profile?.full_name ?? null)
      setOnboardingCompleted(Boolean(profile?.onboarding_completed))
      setPlan((subscription?.plan as PlanKey | null) ?? null)
      setSubscriptionStatus((subscription?.status as SubscriptionStatus | null) ?? 'inactive')
      setRemainingCredits(credits?.remaining_credits ?? 0)
      setHasLoadedAccount(true)
      if (import.meta.env.DEV) {
        console.info('[Scoutly auth] Subscription status checked on login/refresh', {
          userId: accountUser.id,
          subscriptionFound: Boolean(subscription),
          subscriptionStatus: subscription?.status ?? null,
        })
      }
      return activeSubscriptionStatuses.includes(subscription?.status ?? '')
    } finally {
      setSubscriptionLoading(false)
    }
  }, [clearAccountState])

  const refreshSubscription = useCallback(async () => loadAccountState(user), [loadAccountState, user])

  useEffect(() => {
    if (isLocalDemoMode) {
      const demoEmail = window.localStorage.getItem('scoutly_demo_email')
      if (demoEmail) setUser({ id: 'demo-user', email: demoEmail } as User)
      setLoading(false)
      return
    }

    if (!supabase) {
      setLoading(false)
      return
    }

    const client = supabase
    let mounted = true

    async function restoreSession() {
      const { data: sessionData } = await client.auth.getSession()
      const sessionUser = sessionData.session?.user ?? null
      if (!mounted) return

      setUser(sessionUser)
      await loadAccountState(sessionUser)
      if (mounted) setLoading(false)
    }

    restoreSession()

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (!sessionUser) {
        clearAccountState()
        setLoading(false)
        return
      }
      loadAccountState(sessionUser)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [clearAccountState, loadAccountState])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      subscriptionLoading,
      fullName,
      onboardingCompleted,
      plan,
      subscriptionStatus,
      remainingCredits,
      isAdmin: Boolean(user?.email?.includes('admin')),
      isSubscribed: subscriptionStatus === 'active' || subscriptionStatus === 'trialing',
      hasLoadedAccount,
      refreshSubscription,
      signIn: async (email, password) => {
        if (isLocalDemoMode) {
          window.localStorage.setItem('scoutly_demo_email', email)
          setUser({ id: 'demo-user', email } as User)
          setSubscriptionStatus('active')
          return true
        }
        if (!supabase) throw new Error('Supabase is not configured for this deployment.')
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setUser(data.user)
        return loadAccountState(data.user)
      },
      signUp: async (email, password, fullName) => {
        if (isLocalDemoMode) {
          window.localStorage.setItem('scoutly_demo_email', email)
          setUser({ id: 'demo-user', email } as User)
          setFullName(fullName)
          setSubscriptionStatus('active')
          return
        }
        if (!supabase) throw new Error('Supabase is not configured for this deployment.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, email, full_name: fullName })
          setUser(data.user)
          await loadAccountState(data.user)
        }
      },
      resetPassword: async (email) => {
        if (!supabase) throw new Error('Supabase is not configured for this deployment.')
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
      },
      updatePassword: async (password) => {
        if (!supabase) throw new Error('Supabase is not configured for this deployment.')
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
      },
      completeOnboarding: async (preferences) => {
        if (isLocalDemoMode) {
          setOnboardingCompleted(true)
          return
        }
        if (!supabase || !user) throw new Error('You must be logged in to complete onboarding.')
        const { error } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            target_service: preferences.targetService,
            first_search_city: preferences.firstCity,
            target_industry: preferences.targetIndustry,
          })
          .eq('id', user.id)
        if (error) throw error
        setOnboardingCompleted(true)
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut()
        window.localStorage.removeItem('scoutly_demo_email')
        setUser(null)
        clearAccountState()
      },
    }),
    [clearAccountState, fullName, hasLoadedAccount, loadAccountState, loading, onboardingCompleted, plan, refreshSubscription, remainingCredits, subscriptionLoading, subscriptionStatus, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export { hasSupabaseConfig }
