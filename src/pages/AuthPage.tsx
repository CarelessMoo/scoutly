import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('demo@scoutly.com')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') await signIn(email, password)
      else await signUp(email, password)
      navigate(mode === 'signup' ? '/app/onboarding' : '/app')
    } catch (error) {
      toast({ title: 'Authentication failed', description: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="mb-6 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300 font-black text-slate-950">S</span>
            <span className="font-semibold text-white">Scoutly</span>
          </Link>
          <h1 className="text-2xl font-semibold text-white">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-2 text-sm text-slate-400">A paid subscription is required to access lead search and saved workflows.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <label className="block text-sm text-slate-300">
              Email
              <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="block text-sm text-slate-300">
              Password
              <Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
            </label>
            <Button className="w-full" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'login' ? 'Need access?' : 'Already have an account?'}{' '}
            <Link className="text-cyan-200" to={mode === 'login' ? '/signup' : '/login'}>{mode === 'login' ? 'Sign up' : 'Log in'}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
