import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import type { PlanKey, SubscriptionStatus } from '../lib/types'

type AuthContextValue = {
  user: User | null
  loading: boolean
  plan: PlanKey | null
  subscriptionStatus: SubscriptionStatus
  remainingCredits: number
  isAdmin: boolean
  isSubscribed: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<PlanKey | null>('founding')
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('active')
  const [remainingCredits, setRemainingCredits] = useState(2500)

  useEffect(() => {
    if (!supabase) {
      const demoEmail = window.localStorage.getItem('scoutly_demo_email')
      if (demoEmail) setUser({ id: 'demo-user', email: demoEmail } as User)
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
    async function loadSubscription() {
      if (!supabase || !user) return

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
    }

    loadSubscription()
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      plan,
      subscriptionStatus,
      remainingCredits,
      isAdmin: Boolean(user?.email?.includes('admin')),
      isSubscribed: subscriptionStatus === 'active' || subscriptionStatus === 'trialing',
      signIn: async (email, password) => {
        if (!supabase) {
          window.localStorage.setItem('scoutly_demo_email', email)
          setUser({ id: 'demo-user', email } as User)
          setSubscriptionStatus('active')
          return
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signUp: async (email, password) => {
        if (!supabase) {
          window.localStorage.setItem('scoutly_demo_email', email)
          setUser({ id: 'demo-user', email } as User)
          setSubscriptionStatus('active')
          return
        }
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut()
        window.localStorage.removeItem('scoutly_demo_email')
        setUser(null)
      },
    }),
    [loading, plan, remainingCredits, subscriptionStatus, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export { hasSupabaseConfig }
