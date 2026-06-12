import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { getUser, serviceClient } from '../_shared/supabase.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-10-29.clover' })
    const user = await getUser(req)
    const supabase = serviceClient()
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (error || !subscription?.stripe_customer_id) throw new Error('No Stripe customer found')

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${Deno.env.get('APP_URL')}/app/billing`,
    })

    return Response.json({ url: session.url }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Portal failed' }, { status: 400, headers: corsHeaders })
  }
})
