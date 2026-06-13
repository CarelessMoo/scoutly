import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { getUser, serviceClient } from '../_shared/supabase.ts'

const planConfig = {
  founding: { credits: 2000, dailySearchLimit: 75, monthlySearchLimit: 1000, maxSpots: 25 },
  starter: { credits: 1000, dailySearchLimit: 25, monthlySearchLimit: 250 },
  pro: { credits: 3000, dailySearchLimit: 75, monthlySearchLimit: 1000 },
  agency: { credits: 10000, dailySearchLimit: 200, monthlySearchLimit: 3000 },
} as const
const priceEnvByPlan = {
  founding: 'STRIPE_FOUNDING_PRICE_ID',
  starter: 'STRIPE_STARTER_PRICE_ID',
  pro: 'STRIPE_PRO_PRICE_ID',
  agency: 'STRIPE_AGENCY_PRICE_ID',
} as const

function requiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const stripe = new Stripe(requiredSecret('STRIPE_SECRET_KEY'), { apiVersion: '2025-10-29.clover' })
    const user = await getUser(req)
    const { plan } = await req.json()
    if (!(plan in planConfig)) throw new Error('Invalid plan')

    const supabase = serviceClient()
    if (plan === 'founding') {
      const { count, error } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('plan', 'founding')
        .in('status', ['active', 'trialing'])

      if (error) throw error
      if ((count ?? 0) >= planConfig.founding.maxSpots) throw new Error('Founding Member Plan Sold Out')
    }

    const { data: existing } = await supabase.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()

    const customerId =
      existing?.stripe_customer_id ??
      (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id

    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      plan,
      status: 'incomplete',
      monthly_lead_credits: planConfig[plan as keyof typeof planConfig].credits,
      daily_search_limit: planConfig[plan as keyof typeof planConfig].dailySearchLimit,
      monthly_search_limit: planConfig[plan as keyof typeof planConfig].monthlySearchLimit,
    }, { onConflict: 'user_id' })

    const priceId = requiredSecret(priceEnvByPlan[plan as keyof typeof priceEnvByPlan])
    const appUrl = requiredSecret('APP_URL').replace(/\/$/, '')

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
    })

    return Response.json({ url: session.url }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Checkout failed' }, { status: 400, headers: corsHeaders })
  }
})
