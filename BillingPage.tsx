import type { Lead } from './types'

const serviceCategoryKeywords = [
  'contractor',
  'dentist',
  'repair',
  'groomer',
  'tutoring',
  'plumber',
  'electrician',
  'cleaning',
  'agency',
  'law',
  'clinic',
]

export function scoreLead(
  lead: Pick<Lead, 'website' | 'reviewCount' | 'rating' | 'category' | 'phoneNumber'>,
) {
  let score = 20
  const reasons: string[] = []

  if (!lead.website) {
    score += 30
    reasons.push('No website')
  }
  if (lead.rating >= 4.2) {
    score += 15
    reasons.push('Good rating')
  }
  if (lead.reviewCount >= 40) {
    score += 12
    reasons.push('High review count')
  } else if (lead.reviewCount >= 10) {
    score += 7
    reasons.push('Some review traction')
  }
  if (serviceCategoryKeywords.some((keyword) => lead.category.toLowerCase().includes(keyword))) {
    score += 15
    reasons.push('Service-based category')
  }
  if (lead.phoneNumber) {
    score += 8
    reasons.push('Phone available')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons,
  }
}
