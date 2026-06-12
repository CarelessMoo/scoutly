import { MarketingFooter } from '../components/marketing/MarketingFooter'
import { MarketingNav } from '../components/marketing/MarketingNav'
import { Card, CardContent } from '../components/ui/card'

const content = {
  terms: {
    title: 'Terms of Service',
    sections: [
      'Scoutly is a paid lead generation platform for business outreach workflows.',
      'Users are responsible for complying with applicable outreach, privacy, and communications laws.',
      'Scoutly uses official third-party APIs and does not permit scraping Google Maps.',
      'Access to paid features requires an active subscription in good standing.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      'Scoutly stores account, subscription, search, saved lead, and usage data needed to operate the service.',
      'API keys are kept on the backend and are never intentionally exposed to browser clients.',
      'Customer data is protected with Supabase Row Level Security so users can only access their own records.',
      'Billing is processed through Stripe. Scoutly does not store full payment card details.',
    ],
  },
  refunds: {
    title: 'Refund Policy',
    sections: [
      'Scoutly is subscription-based with no free plan.',
      'Refund requests are reviewed case by case for billing errors, duplicate charges, or service access issues.',
      'Used lead credits and completed API-backed searches are generally not refundable.',
      'Customers can manage or cancel billing through the Stripe customer billing portal.',
    ],
  },
}

export function LegalPage({ type }: { type: keyof typeof content }) {
  const page = content[type]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">{page.title}</h1>
        <Card className="mt-8">
          <CardContent className="space-y-5 text-sm leading-7 text-slate-300">
            {page.sections.map((section) => <p key={section}>{section}</p>)}
          </CardContent>
        </Card>
      </main>
      <MarketingFooter />
    </div>
  )
}
