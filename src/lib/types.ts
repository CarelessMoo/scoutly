export type PlanKey = 'founding' | 'starter' | 'pro' | 'agency'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'inactive'

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up'
  | 'Closed'
  | 'Not Interested'

export type Lead = {
  id: string
  placeId?: string
  businessName: string
  phoneNumber: string
  website: string | null
  address: string
  rating: number
  reviewCount: number
  category: string
  googleMapsUrl: string
  city: string
  state: string
  dateAdded: string
  leadScore: number
  scoreReasons: string[]
  status: LeadStatus
  notes: string
  tags: string[]
  followUpDate?: string
  missingSocialLinks?: boolean
  missingContactMethods?: boolean
}

export type SearchHistoryItem = {
  id: string
  keyword: string
  city: string
  state: string
  radius: number
  leadsReturned: number
  creditsUsed: number
  resultCount: number
  createdAt: string
}

export type CalendarEvent = {
  id: string
  leadId: string
  title: string
  type: 'Follow-up' | 'Call' | 'Meeting'
  startsAt: string
}
