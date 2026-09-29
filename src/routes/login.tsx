import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Lock, MailCheck, ShieldCheck } from 'lucide-react'
import {
  AuthError,
  MissingIdentityError,
  acceptInvite,
  login,
  requestPasswordRecovery,
  signup,
  updateUser,
} from '@netlify/identity'
import { Logo } from '@/components/Logo'
import { INVITE_TOKEN_KEY } from '@/components/CallbackHandler'
import { getServerUser } from '@/lib/auth'

type Mode = 'signin' | 'signup' | 'forgot' | 'reset' | 'invite'
const modes: Mode[] = ['signin', 'signup', 'forgot', 'reset', 'invite']

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode; expired?: boolean } => ({
    mode: modes.includes(search.mode as Mode) ? (search.mode as Mode) : undefined,
    expired: search.expired === true || search.expired === '1' || search.expired === 1 ? true : undefined,
  }),
  beforeLoad: async ({ search }) => {
    // Signed-in visitors skip the form, except when finishing a password reset.
    if (search.mode === 'reset') return
    const user = await getServerUser()
    if (user) throw redirect({ to: '/app' })
  },
  head: () => ({ meta: [{ title: 'Sign in — Ledgerwise' }] }),
  component: Login,
})

const copy: Record<Mode, { title: string; lead: string; cta: string }> = {
  signin: { title: 'Welcome back.', lead: 'Sign in to see your financial health score.', cta: 'Sign in' },
  signup: { title: 'Start your ledger.', lead: 'Create a free account in under a minute.', cta: 'Create account' },
  forgot: { title: 'Reset your password.', lead: "Enter your email and we'll send you a reset link.", cta: 'Send reset link' },
  reset: { title: 'Choose a new password.', lead: 'Pick a new password to finish resetting your account.', cta: 'Save password' },
  invite: { title: "You're invited.", lead: 'Set a password to activate your account.', cta: 'Activate account' },
}

function describeError(error: unknown, mode: Mode) {
  if (error instanceof MissingIdentityError) return 'Sign-in is not available in this environment yet. Try the deployed site.'
  if (error instanceof AuthError) {
    if (error.status === 401) return mode === 'signin' ? 'Invalid email or password.' : 'Your link has expired. Request a new one.'
    if (error.status === 403) return 'New sign-ups are currently closed.'
    if (error.status === 422) return error.message || 'Check your email and password.'
    if (/confirm/i.test(error.message)) return 'Confirm your email first — check your inbox for the link.'
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

function Login() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const mode: Mode = search.mode ?? 'signin'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(
    search.expired ? 'That link has expired or was already used. Sign in or request a new one.' : null,
  )

  const needsEmail = mode === 'signin' || mode === 'signup' || mode === 'forgot'
  const needsPassword = mode !== 'forgot'

  const setMode = (m: Mode) => {
    setErrors({})
    setNotice(null)
    navigate({ search: { mode: m === 'signin' ? undefined : m } })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (mode === 'signup' && !name.trim()) next.name = 'Tell us your name.'
    if (needsEmail && !/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.'
    if (needsPassword && password.length < 8) next.password = 'Use at least 8 characters.'
    setErrors(next)
    setNotice(null)
    if (Object.keys(next).length) return
    setPending(true)
    try {
      if (mode === 'signin') {
        await login(email, password)
      } else if (mode === 'signup') {
        const user = await signup(email, password, { full_name: name.trim() })
        if (!user.confirmedAt) {
          setNotice(`We sent a confirmation link to ${email}. Open it to finish creating your account.`)
          setPassword('')
          return
        }
      } else if (mode === 'forgot') {
        await requestPasswordRecovery(email)
        setNotice(`If an account exists for ${email}, a reset link is on its way.`)
        return
      } else if (mode === 'reset') {
        await updateUser({ password })
      } else {
        const token = sessionStorage.getItem(INVITE_TOKEN_KEY)
        if (!token) throw new AuthError('This invite link is no longer valid.')
        await acceptInvite(token, password)
        sessionStorage.removeItem(INVITE_TOKEN_KEY)
      }
      // Full navigation so the server receives the new session cookie.
      window.location.href = '/app'
    } catch (error) {
      setErrors({ form: describeError(error, mode) })
    } finally {
      setPending(false)
    }
  }

  const input = 'w-full rounded-xl border bg-card px-4 py-3 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10'

  return (
    <div className="grain grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-moss/50 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-24 h-40 w-40 rounded-full bg-brass/30 blur-3xl" />
        <p className="font-display text-xl font-semibold">Ledgerwise</p>
        <div className="relative mt-auto max-w-md">
          <p className="font-display text-4xl leading-tight">
            “I finally know my savings rate — and I've watched it climb from 8% to 23%.”
          </p>
          <p className="mt-6 text-sm text-paper/60">Priya S., freelance designer</p>
        </div>
        <div className="relative mt-12 grid grid-cols-3 gap-4 border-t border-paper/15 pt-6 text-sm">
          <div>
            <p className="font-display text-2xl">5</p>
            <p className="text-paper/60">health indicators</p>
          </div>
          <div>
            <p className="font-display text-2xl">14</p>
            <p className="text-paper/60">smart categories</p>
          </div>
          <div>
            <p className="font-display text-2xl">1</p>
            <p className="text-paper/60">clear score</p>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="rise font-display text-4xl font-semibold tracking-tight">{copy[mode].title}</h1>
          <p className="rise mt-2 text-ink-soft" style={{ animationDelay: '60ms' }}>
            {copy[mode].lead}
          </p>

          {(mode === 'signin' || mode === 'signup') && (
            <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-paper-deep p-1 text-sm font-semibold">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-xl py-2 transition ${mode === m ? 'bg-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          {notice && (
            <p className="rise mt-6 flex items-start gap-2 rounded-2xl border border-moss/30 bg-moss-soft px-4 py-3 text-sm font-medium text-moss">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
            </p>
          )}

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={`${input} ${errors.name ? 'border-clay' : 'border-line'}`}
                />
                {errors.name && <span className="mt-1 block text-xs text-clay">{errors.name}</span>}
              </label>
            )}
            {needsEmail && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`${input} ${errors.email ? 'border-clay' : 'border-line'}`}
                />
                {errors.email && <span className="mt-1 block text-xs text-clay">{errors.email}</span>}
              </label>
            )}
            {needsPassword && (
              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-sm font-medium">
                  {mode === 'reset' || mode === 'invite' ? 'New password' : 'Password'}
                  {mode === 'signin' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs font-semibold text-moss hover:underline">
                      Forgot password?
                    </button>
                  )}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className={`${input} ${errors.password ? 'border-clay' : 'border-line'}`}
                />
                {errors.password && <span className="mt-1 block text-xs text-clay">{errors.password}</span>}
              </label>
            )}

            {errors.form && <p className="text-sm text-clay">{errors.form}</p>}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-paper transition hover:bg-moss disabled:opacity-70"
            >
              <Lock className="h-4 w-4" />
              {pending ? 'Please wait…' : copy[mode].cta}
            </button>
          </form>

          {mode === 'forgot' && (
            <p className="mt-4 text-center text-sm">
              <button type="button" onClick={() => setMode('signin')} className="font-semibold text-moss hover:underline">
                Back to sign in
              </button>
            </p>
          )}

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
            Your ledger is private to your account and stored securely in your own database.
          </p>
          <p className="mt-8 text-center text-sm text-ink-soft">
            <Link to="/" className="font-semibold text-ink hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
