import { supabase } from './supabase'
import type { PlanKey } from './types'

const functionsBaseUrl =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ??
  'https://hzesigjnerfviumzkeze.supabase.co/functions/v1'

async function getAuthToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function createCheckoutSession(plan: PlanKey) {
  const token = await getAuthToken()
  const response = await fetch(`${functionsBaseUrl}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ plan }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error ?? 'Unable to start checkout.')
  }
  return response.json() as Promise<{ url: string }>
}

export async function openBillingPortal() {
  const token = await getAuthToken()
  const response = await fetch(`${functionsBaseUrl}/create-billing-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!response.ok) throw new Error('Unable to open billing portal.')
  return response.json() as Promise<{ url: string }>
}

export async function searchPlaces(payload: Record<string, unknown>) {
  const token = await getAuthToken()
  const response = await fetch(`${functionsBaseUrl}/search-places`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Search failed. Check subscription and remaining credits.')
  return response.json()
}

export async function getFoundingStatus() {
  const response = await fetch(`${functionsBaseUrl}/founding-status`)
  if (!response.ok) throw new Error('Unable to load founding member availability.')
  return response.json() as Promise<{ claimed: number; max: number; remaining: number; soldOut: boolean }>
}

export async function confirmCheckoutSession(sessionId?: string | null) {
  const token = await getAuthToken()
  const response = await fetch(`${functionsBaseUrl}/confirm-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ sessionId }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error ?? 'Unable to confirm checkout.')
  }
  return response.json() as Promise<{ active: boolean }>
}
