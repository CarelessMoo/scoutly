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
  refreshSubscription: () => Promise<boolean>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  completeOnboarding: (preferences: { targetService: string; firstCity: string; targetIndustry: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const isLocalDemoMode = import.meta.env.DEV && !hasSupabaseConfig

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<PlanKey | null>(isLocalDemoMode ? 'founding' : null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(isLocalDemoMode ? 'active' : 'inactive')
  const [remainingCredits, setRemainingCredits] = useState(isLocalDemoMode ? 2000 : 0)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [fullName, setFullName] = useState<string | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState(isLocalDemoMode)

  const refreshSubscription = useCallback(async () => {
    if (isLocalDemoMode) return true
    if (!supabase || !user) {
      setPlan(null)
      setSubscriptionStatus('inactive')
      setRemainingCredits(0)
      return false
    }

    setSubscriptionLoading(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: credits } = await supabase
        .from('usage_credits')
        .select('remaining_credits')
        .eq('user_id', user.id)
        .maybeSingle()

      setFullName(profile?.full_name ?? null)
      setOnboardingCompleted(Boolean(profile?.onboarding_completed))
      setPlan((subscription?.plan as PlanKey | null) ?? null)
      setSubscriptionStatus((subscription?.status as SubscriptionStatus | null) ?? 'inactive')
      setRemainingCredits(credits?.remaining_credits ?? 0)
      return subscription?.status === 'active' || subscription?.status === 'trialing'
    } finally {
      setSubscriptionLoading(false)
    }
  }, [user])

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

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    refreshSubscription()
  }, [refreshSubscription])

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
      refreshSubscription,
      signIn: async (email, password) => {
        if (isLocalDemoMode) {
          window.localStorage.setItem('scoutly_demo_email', email)
          setUser({ id: 'demo-user', email } as User)
          setSubscriptionStatus('active')
          return
        }
        if (!supabase) throw new Error('Supabase is not configured for this deployment.')
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
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
      },
    }),
    [fullName, loading, onboardingCompleted, plan, refreshSubscription, remainingCredits, subscriptionLoading, subscriptionStatus, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export { hasSupabaseConfig }
