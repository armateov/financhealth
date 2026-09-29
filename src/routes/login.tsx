import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Sign in — Ledgerwise' }] }),
  component: Login,
})

type Mode = 'signin' | 'signup'

function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (mode === 'signup' && !name.trim()) next.name = 'Tell us your name.'
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.'
    if (password.length < 8) next.password = 'Use at least 8 characters.'
    setErrors(next)
    if (Object.keys(next).length) return
    setPending(true)
    // Preview: opens the demo ledger. Real accounts are wired up in the auth milestone.
    setTimeout(() => navigate({ to: '/app' }), 500)
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
          <h1 className="rise font-display text-4xl font-semibold tracking-tight">
            {mode === 'signin' ? 'Welcome back.' : 'Start your ledger.'}
          </h1>
          <p className="rise mt-2 text-ink-soft" style={{ animationDelay: '60ms' }}>
            {mode === 'signin'
              ? 'Sign in to see your financial health score.'
              : 'Create a free account in under a minute.'}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-paper-deep p-1 text-sm font-semibold">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setErrors({})
                }}
                className={`rounded-xl py-2 transition ${mode === m ? 'bg-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink'}`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

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
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-sm font-medium">
                Password
                {mode === 'signin' && (
                  <button type="button" className="text-xs font-semibold text-moss hover:underline">
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

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-paper transition hover:bg-moss disabled:opacity-70"
            >
              <Lock className="h-4 w-4" />
              {pending ? 'Opening your ledger…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
            Your ledger is private to your account. Preview tip: any email and an 8+ character password opens the demo ledger.
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
