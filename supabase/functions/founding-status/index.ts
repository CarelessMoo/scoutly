import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { serviceClient } from '../_shared/supabase.ts'

const maxFoundingSpots = 25

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = serviceClient()
    const { count, error } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'founding')
      .in('status', ['active', 'trialing'])

    if (error) throw error

    const claimed = count ?? 0
    const remaining = Math.max(0, maxFoundingSpots - claimed)
    return Response.json({ claimed, max: maxFoundingSpots, remaining, soldOut: remaining === 0 }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to load founding status' }, { status: 400, headers: corsHeaders })
  }
})
