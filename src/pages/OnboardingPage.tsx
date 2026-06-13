import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'

const services = ['Web Design', 'SEO', 'Marketing', 'Consulting', 'Other']

export function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [targetService, setTargetService] = useState('Web Design')
  const [firstCity, setFirstCity] = useState('')
  const [targetIndustry, setTargetIndustry] = useState('')
  const [loading, setLoading] = useState(false)
  const { completeOnboarding } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  async function finish() {
    if (!firstCity.trim() || !targetIndustry.trim()) {
      toast({ title: 'Finish onboarding', description: 'Add a city and target industry before continuing.' })
      return
    }
    setLoading(true)
    try {
      await completeOnboarding({ targetService, firstCity, targetIndustry })
      toast({ title: 'Scoutly is ready', description: 'Your search preferences were saved.' })
      navigate('/app')
    } catch (error) {
      toast({ title: 'Onboarding failed', description: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center">
      <Card className="page-enter w-full">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Onboarding</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Set up your first Scoutly workflow.</h1>
          <p className="mt-2 text-sm text-slate-400">Three quick answers help tailor your first lead search.</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((item) => <div key={item} className={`h-1.5 rounded-full ${step >= item ? 'bg-cyan-300' : 'bg-white/10'}`} />)}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">What type of businesses do you target?</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <button
                    key={service}
                    className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${targetService === service ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-slate-300'}`}
                    onClick={() => setTargetService(service)}
                    type="button"
                  >
                    <span className="flex items-center justify-between">
                      {service}
                      {targetService === service && <CheckCircle2 className="h-4 w-4" />}
                    </span>
                  </button>
                ))}
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>Continue <ArrowRight className="h-4 w-4" /></Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">What city would you like to search first?</h2>
              <Input placeholder="Chicago, Austin, Phoenix..." value={firstCity} onChange={(event) => setFirstCity(event.target.value)} />
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Continue</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">What industry do you target most?</h2>
              <Input placeholder="Dentists, roofers, med spas..." value={targetIndustry} onChange={(event) => setTargetIndustry(event.target.value)} />
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={finish} disabled={loading}>{loading ? 'Saving...' : 'Enter dashboard'}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
