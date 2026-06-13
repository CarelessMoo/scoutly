import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import type { PlanKey, SubscriptionStatus } from '../lib/types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  subscriptionLoading: boolean
  plan: PlanKey | null
  subscriptionStatus: SubscriptionStatus
  remainingCredits: number
  isAdmin: boolean
  isSubscribed: boolean
  refreshSubscription: () => Promise<boolean>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
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

  async function refreshSubscription() {
    if (isLocalDemoMode) return true
    if (!supabase || !user) {
      setPlan(null)
      setSubscriptionStatus('inactive')
      setRemainingCredits(0)
      return false
    }

    setSubscriptionLoading(true)
    try {
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

      setPlan((subscription?.plan as PlanKey | null) ?? null)
      setSubscriptionStatus((subscription?.status as SubscriptionStatus | null) ?? 'inactive')
      setRemainingCredits(credits?.remaining_credits ?? 0)
      return subscription?.status === 'active' || subscription?.status === 'trialing'
    } finally {
      setSubscriptionLoading(false)
    }
  }

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
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      subscriptionLoading,
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
      signUp: async (email, password) => {
        if (isLocalDemoMode) {
          window.localStorage.setItem('scoutly_demo_email', email)
          setUser({ id: 'demo-user', email } as User)
          setSubscriptionStatus('active')
          return
        }
        if (!supabase) throw new Error('Supabase is not configured for this deployment.')
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })
        if (error) throw error
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut()
        window.localStorage.removeItem('scoutly_demo_email')
        setUser(null)
      },
    }),
    [loading, plan, remainingCredits, subscriptionLoading, subscriptionStatus, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export { hasSupabaseConfig }
