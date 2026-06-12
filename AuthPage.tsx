import Papa from 'papaparse'
import type { Lead } from './types'

export function exportLeadsCsv(leads: Lead[], filename: string) {
  const rows = leads.map((lead) => ({
    'Business Name': lead.businessName,
    Phone: lead.phoneNumber,
    Website: lead.website ?? '',
    Address: lead.address,
    Rating: lead.rating,
    'Review Count': lead.reviewCount,
    Category: lead.category,
    'Google Maps URL': lead.googleMapsUrl,
    City: lead.city,
    State: lead.state,
    'Lead Score': lead.leadScore,
    Status: lead.status,
    Notes: lead.notes,
    Tags: lead.tags.join(', '),
    'Follow-up Date': lead.followUpDate ?? '',
    'Date Added': lead.dateAdded,
  }))

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
