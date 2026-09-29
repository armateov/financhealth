import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, NotebookPen, Gauge, ShieldCheck, TrendingUp } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { balanceSheet, currentMonth, transactions } from '@/lib/fixtures'
import { computeIndicators, statusStyles } from '@/lib/finance'

export const Route = createFileRoute('/')({
  component: Landing,
})

const features = [
  {
    icon: NotebookPen,
    title: 'Record in seconds',
    body: 'Log income and expenses with smart categories that map automatically to needs, wants and savings.',
  },
  {
    icon: Gauge,
    title: 'One honest score',
    body: 'Five planner-grade indicators roll up into a single 0–100 financial health score you can actually improve.',
  },
  {
    icon: TrendingUp,
    title: 'See the trend',
    body: 'Cash flow, spending mix and net worth over time — so you know if this month was a blip or a pattern.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    body: 'Every ledger sits behind its own secure login. Your numbers are yours alone.',
  },
]

function Landing() {
  const { indicators, score, status } = computeIndicators(transactions, balanceSheet, currentMonth)
  const s = statusStyles[status]

  return (
    <div className="grain min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <a href="#indicators" className="hidden rounded-full px-4 py-2 text-ink-soft no-underline hover:text-ink sm:block">
            Indicators
          </a>
          <Link to="/login" className="rounded-full px-4 py-2 text-ink no-underline hover:bg-paper-deep">
            Sign in
          </Link>
          <Link to="/login" className="rounded-full bg-ink px-4 py-2 text-paper no-underline transition hover:bg-moss">
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-moss" /> Personal finance, measured
            </p>
            <h1
              className="rise mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl"
              style={{ animationDelay: '80ms' }}
            >
              Know where your money goes — <em className="font-normal text-moss">and how healthy</em> it leaves you.
            </h1>
            <p className="rise mt-6 max-w-lg text-lg leading-relaxed text-ink-soft" style={{ animationDelay: '160ms' }}>
              Ledgerwise records every income and expense, then tracks the indicators financial planners use —
              savings rate, emergency fund, debt-to-income — in one clear health score.
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: '240ms' }}>
              <Link
                to="/login"
                className="group flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-paper no-underline transition hover:bg-moss"
              >
                Start your ledger <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/app"
                className="rounded-full border border-ink/20 px-6 py-3.5 text-sm font-semibold text-ink no-underline transition hover:border-ink hover:bg-card"
              >
                Explore the demo
              </Link>
            </div>
          </div>

          <div className="rise relative" style={{ animationDelay: '200ms' }}>
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-moss-soft/70 blur-2xl" />
            <div className="rotate-[1.5deg] rounded-[2rem] border border-line bg-card p-6 shadow-[0_40px_80px_-40px_rgba(22,33,28,0.45)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">September health check</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <span className="tabular font-display text-7xl font-semibold leading-none">{score}</span>
                <span className="pb-2 text-sm text-ink-soft">/ 100 health score</span>
              </div>
              <ul className="mt-6 space-y-3.5">
                {indicators.map((ind) => {
                  const st = statusStyles[ind.status]
                  return (
                    <li key={ind.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{ind.label}</span>
                        <span className="tabular font-semibold">{ind.display}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-paper-deep">
                        <div className={`h-full rounded-full ${st.dot}`} style={{ width: `${Math.max(4, ind.score)}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="absolute -bottom-6 -left-6 -rotate-3 rounded-2xl bg-ink px-5 py-4 text-paper shadow-xl">
              <p className="text-xs text-paper/60">Just recorded</p>
              <p className="mt-0.5 text-sm font-semibold">
                Green Market <span className="ml-3 tabular text-clay-soft">−$153.47</span>
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-card/60">
          <div className="mx-auto grid max-w-6xl gap-px px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="p-4">
                <Icon className="h-6 w-6 text-moss" />
                <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="indicators" className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">The indicators</p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">
                The benchmarks planners use, calculated for you every month.
              </h2>
              <p className="mt-4 text-ink-soft">
                No spreadsheets. Each entry you record updates the numbers instantly, with a plain-language target so
                you always know what "good" looks like.
              </p>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              {indicators.map((ind, i) => (
                <li key={ind.id} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 sm:grid-cols-[2.5rem_1fr_auto]">
                  <span className="font-display text-2xl text-ink-soft/50">0{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{ind.label}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{ind.explanation}</p>
                  </div>
                  <span className="col-start-2 self-center text-sm font-semibold text-moss sm:col-start-3">{ind.target}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-8 py-16 text-center text-paper sm:px-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-moss/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-brass/25 blur-3xl" />
            <h2 className="relative font-display text-4xl font-semibold sm:text-5xl">Your first health check takes five minutes.</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-paper/70">
              Record last month's income and a few regular bills — Ledgerwise does the math.
            </p>
            <Link
              to="/login"
              className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3.5 text-sm font-semibold text-ink no-underline transition hover:bg-moss-soft"
            >
              Create a free account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-ink-soft">
          <Logo />
          <p>© 2026 Ledgerwise. Educational guidance, not financial advice.</p>
        </div>
      </footer>
    </div>
  )
}
