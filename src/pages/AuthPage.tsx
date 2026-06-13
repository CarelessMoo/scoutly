import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAuth } from '../providers/AuthProvider'
import { useToast } from '../providers/ToastProvider'

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset'

export function AuthPage({ mode }: { mode: AuthMode }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validation, setValidation] = useState('')
  const { user, loading: authLoading, isSubscribed, signIn, signUp, resetPassword, updatePassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  const isReset = mode === 'reset'

  useEffect(() => {
    if (authLoading || !user || isReset) return
    navigate(isSubscribed ? '/app' : '/pricing?notice=subscription-required', { replace: true })
  }, [authLoading, isReset, isSubscribed, navigate, user])

  const passwordScore = useMemo(() => {
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  }, [password])

  function validate() {
    if (!isReset && !email) return 'Email address is required.'
    if (isForgot) return ''
    if (!password || password.length < 8) return 'Password must be at least 8 characters.'
    if ((isSignup || isReset) && password !== confirmPassword) return 'Passwords do not match.'
    if (isSignup) {
      if (!fullName.trim()) return 'Full name is required.'
      if (!termsAccepted) return 'You must accept the Terms of Service.'
      if (!privacyAccepted) return 'You must accept the Privacy Policy.'
    }
    return ''
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const message = validate()
    setValidation(message)
    if (message) return

    setLoading(true)
    try {
      if (isForgot) {
        await resetPassword(email)
        toast({ title: 'Reset link sent', description: 'Check your email for a secure password reset link.' })
        return
      }

      if (isReset) {
        await updatePassword(password)
        toast({ title: 'Password updated', description: 'You can now continue with your Scoutly account.' })
        navigate('/login')
        return
      }

      if (mode === 'login') {
        const active = await signIn(email, password)
        navigate(active ? '/app' : '/pricing?notice=subscription-required')
      } else {
        await signUp(email, password, fullName)
        toast({ title: 'Account created', description: 'Choose a Scoutly plan to activate your workspace.' })
        navigate('/pricing')
      }
    } catch (error) {
      toast({ title: 'Authentication failed', description: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-slate-100">
      {authLoading ? (
        <Card className="page-enter w-full max-w-md text-center">
          <CardContent>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <h1 className="text-xl font-semibold text-white">Restoring your Scoutly session</h1>
            <p className="mt-2 text-sm text-slate-400">Checking your saved login before continuing.</p>
          </CardContent>
        </Card>
      ) : (
      <Card className="page-enter w-full max-w-md">
        <CardHeader>
          <Link to="/" className="mb-6 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300 font-black text-slate-950">S</span>
            <span className="font-semibold text-white">Scoutly</span>
          </Link>
          <h1 className="text-2xl font-semibold text-white">
            {isForgot ? 'Reset your password' : isReset ? 'Choose a new password' : isSignup ? 'Create your Scoutly account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSignup
              ? 'Create your account first, then choose the plan that fits your outreach.'
              : isReset
                ? 'Enter a new password to secure your Scoutly account.'
                : 'Use your Scoutly account to continue.'}
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            {isSignup && (
              <label className="block text-sm text-slate-300">
                Full Name
                <Input className="mt-2" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" />
              </label>
            )}
            {!isReset && (
              <label className="block text-sm text-slate-300">
                Email Address
                <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </label>
            )}
            {!isForgot && (
              <label className="block text-sm text-slate-300">
                {isReset ? 'New Password' : 'Password'}
                <div className="relative mt-2">
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignup || isReset ? 'new-password' : 'current-password'} />
                  <button type="button" className="absolute right-2 top-2 text-slate-500 hover:text-white" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>
            )}
            {(isSignup || isReset) && (
              <>
                <div>
                  <div className="mb-2 flex gap-1">
                    {[0, 1, 2, 3].map((step) => <div key={step} className={`h-1.5 flex-1 rounded-full ${passwordScore > step ? 'bg-cyan-300' : 'bg-white/10'}`} />)}
                  </div>
                  <p className="text-xs text-slate-500">Use 8+ characters with uppercase, number, and symbol for a stronger password.</p>
                </div>
                <label className="block text-sm text-slate-300">
                  Confirm Password
                  <Input className="mt-2" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
                </label>
              </>
            )}
            {isSignup && (
              <>
                <label className="flex gap-3 text-sm text-slate-300">
                  <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
                  <span>I agree to the <Link className="text-cyan-200" to="/terms">Terms of Service</Link>.</span>
                </label>
                <label className="flex gap-3 text-sm text-slate-300">
                  <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} />
                  <span>I agree to the <Link className="text-cyan-200" to="/privacy">Privacy Policy</Link>.</span>
                </label>
              </>
            )}
            {validation && <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{validation}</p>}
            <Button className="w-full" disabled={loading}>{loading ? 'Please wait...' : isForgot ? 'Send reset link' : isReset ? 'Update password' : isSignup ? 'Create account' : 'Log in'}</Button>
          </form>
          <div className="mt-5 space-y-2 text-center text-sm text-slate-500">
            {mode === 'login' && <Link className="block text-cyan-200" to="/forgot-password">Forgot password?</Link>}
            {!isReset && (
              <p>
                {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
                <Link className="text-cyan-200" to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Sign up'}</Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
