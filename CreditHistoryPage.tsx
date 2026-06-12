import type { PlanKey } from './types'

export const plans: Record<
  PlanKey,
  {
    name: string
    price: number
    credits: number
    dailySearchLimit: number
    monthlySearchLimit: number
    stripePriceEnv: string
    features: string[]
    badge?: string
    foundingMaxSpots?: number
    foundingClaimedSpots?: number
  }
> = {
  founding: {
    name: 'Founding Member',
    price: 19,
    credits: 2000,
    dailySearchLimit: 75,
    monthlySearchLimit: 1000,
    stripePriceEnv: 'STRIPE_FOUNDING_PRICE_ID',
    badge: 'Founding Member • Lifetime Pricing',
    foundingMaxSpots: 25,
    foundingClaimedSpots: 0,
    features: [
      '2,000 lead credits/month',
      'Lifetime locked-in pricing',
      'Limited to the first 25 customers',
      'Includes all platform features',
      'Grandfathered pricing forever',
    ],
  },
  starter: {
    name: 'Starter',
    price: 29,
    credits: 1000,
    dailySearchLimit: 25,
    monthlySearchLimit: 250,
    stripePriceEnv: 'STRIPE_STARTER_PRICE_ID',
    features: ['1,000 lead credits/month', 'Saved leads', 'CSV exports', 'Pipeline board'],
  },
  pro: {
    name: 'Pro',
    price: 49,
    credits: 3000,
    dailySearchLimit: 75,
    monthlySearchLimit: 1000,
    stripePriceEnv: 'STRIPE_PRO_PRICE_ID',
    features: ['3,000 lead credits/month', 'Advanced filters', 'Calendar reminders', 'Priority support'],
  },
  agency: {
    name: 'Agency',
    price: 99,
    credits: 10000,
    dailySearchLimit: 200,
    monthlySearchLimit: 3000,
    stripePriceEnv: 'STRIPE_AGENCY_PRICE_ID',
    features: ['10,000 lead credits/month', 'Team-ready workflow', 'High-volume exporting', 'Agency pipeline'],
  },
}

export function getFoundingRemainingSpots() {
  const plan = plans.founding
  return Math.max(0, (plan.foundingMaxSpots ?? 25) - (plan.foundingClaimedSpots ?? 0))
}
