import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { getUser, serviceClient } from '../_shared/supabase.ts'

const serviceCategoryKeywords = ['contractor', 'dentist', 'repair', 'groomer', 'tutoring', 'plumber', 'electrician', 'cleaning', 'agency', 'law', 'clinic']

function fingerprint(lead: { placeId?: string; businessName: string; phoneNumber: string; address: string }) {
  if (lead.placeId) return `place:${lead.placeId}`
  return `fallback:${[lead.businessName, lead.phoneNumber, lead.address].join('|').toLowerCase().replace(/\s+/g, ' ').trim()}`
}

function scoreLead(place: { websiteUri?: string; rating?: number; userRatingCount?: number; primaryTypeDisplayName?: { text?: string }; nationalPhoneNumber?: string }) {
  let score = 20
  const reasons: string[] = []
  const category = place.primaryTypeDisplayName?.text ?? ''

  if (!place.websiteUri) {
    score += 30
    reasons.push('No website')
  }
  if ((place.rating ?? 0) >= 4.2) {
    score += 15
    reasons.push('Good rating')
  }
  if ((place.userRatingCount ?? 0) >= 40) {
    score += 12
    reasons.push('High review count')
  } else if ((place.userRatingCount ?? 0) >= 10) {
    score += 7
    reasons.push('Some review traction')
  }
  if (serviceCategoryKeywords.some((keyword) => category.toLowerCase().includes(keyword))) {
    score += 15
    reasons.push('Service-based category')
  }
  if (place.nationalPhoneNumber) {
    score += 8
    reasons.push('Phone available')
  }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const user = await getUser(req)
    const supabase = serviceClient()
    const payload = await req.json()

    const quotaCheck = await supabase.rpc('assert_search_allowed', { target_user_id: user.id })
    if (quotaCheck.error) throw quotaCheck.error

    const textQuery = [payload.keyword, payload.businessType, payload.industry, payload.city, payload.state].filter(Boolean).join(' ')
    const googleResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': Deno.env.get('GOOGLE_PLACES_API_KEY')!,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.googleMapsUri',
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 20,
      }),
    })

    if (!googleResponse.ok) throw new Error('Google Places request failed')
    const googleData = await googleResponse.json()
    const leads = (googleData.places ?? []).map((place: any) => {
      const score = scoreLead(place)
      return {
      placeId: place.id,
      businessName: place.displayName?.text ?? 'Unknown business',
      phoneNumber: place.nationalPhoneNumber ?? '',
      website: place.websiteUri ?? null,
      address: place.formattedAddress ?? '',
      rating: place.rating ?? 0,
      reviewCount: place.userRatingCount ?? 0,
      category: place.primaryTypeDisplayName?.text ?? '',
      googleMapsUrl: place.googleMapsUri ?? '',
      leadScore: score.score,
      scoreReasons: score.reasons,
      dateAdded: new Date().toISOString(),
      }
    })

    const fingerprints = leads.map(fingerprint)
    const { data: existingLeads } = await supabase
      .from('returned_leads')
      .select('fingerprint')
      .eq('user_id', user.id)
      .in('fingerprint', fingerprints)

    const existingFingerprints = new Set((existingLeads ?? []).map((lead) => lead.fingerprint))
    const duplicateCount = leads.filter((lead) => existingFingerprints.has(fingerprint(lead))).length

    await supabase.from('search_history').insert({
      user_id: user.id,
      business_type: payload.businessType,
      industry: payload.industry,
      keyword: payload.keyword,
      city: payload.city,
      state: payload.state,
      radius: payload.radius,
      filters: payload.filters ?? {},
      leads_returned: leads.length,
      result_count: leads.length,
      credits_used: 0,
      duplicate_count: duplicateCount,
    })

    return Response.json({ leads, creditsUsed: 0, duplicateCount }, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Search failed' }, { status: 400, headers: corsHeaders })
  }
})
