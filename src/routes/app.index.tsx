import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { ArrowDownRight, ArrowUpRight, ArrowRight, PiggyBank, Wallet, Landmark, Receipt, Sparkles } from 'lucide-react'
import { currentMonth } from '@/lib/fixtures'
import {
  computeIndicators,
  formatDate,
  formatMoney,
  formatMonth,
  getCategory,
  netWorth,
  previousMonths,
  statusStyles,
  summarizeMonth,
  type Indicator,
} from '@/lib/finance'
import { useLedger, useLedgerActions } from '@/lib/store'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

ChartJS.defaults.font.family = 'Manrope, ui-sans-serif, system-ui, sans-serif'
ChartJS.defaults.color = '#4b5750'

export const Route = createFileRoute('/app/')({
  component: Overview,
})

const gridColor = 'rgba(22, 33, 28, 0.07)'
const tooltip = {
  backgroundColor: '#16211c',
  padding: 10,
  cornerRadius: 8,
  titleFont: { weight: 600 as const },
  callbacks: { label: (ctx: any) => ` ${ctx.dataset.label ?? ctx.label}: ${formatMoney(ctx.parsed.y ?? ctx.parsed)}` },
}

function Overview() {
  const { transactions: txs, balanceSheet, netWorthHistory, profile } = useLedger()
  const months = previousMonths(currentMonth, 6)

  const { summaries, cur, prev, health, worth } = useMemo(() => {
    const summaries = months.map((m) => summarizeMonth(txs, m))
    return {
      summaries,
      cur: summaries[summaries.length - 1],
      prev: summaries[summaries.length - 2],
      health: computeIndicators(txs, balanceSheet, currentMonth),
      worth: netWorth(balanceSheet),
    }
  }, [txs, balanceSheet])

  const prevMonth = months[months.length - 2]
  const worthPrev = netWorthHistory.find((p) => p.month === prevMonth)?.value ?? worth.net
  const firstName = (profile.name || profile.email.split('@')[0]).split(' ')[0]
  const sorted = [...health.indicators].sort((a, b) => a.score - b.score)
  const weakest = sorted[0]
  const strongest = sorted[sorted.length - 1]

  return (
    <div className="space-y-8">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-soft">
            {formatMonth(currentMonth, 'long')}
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Hello, {firstName}.
          </h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            You kept <strong className="text-ink">{formatMoney(cur.income - cur.spending)}</strong> of
            this month's income. Here's how your finances are holding up.
          </p>
        </div>
        <Link
          to="/app/transactions"
          search={{ add: true }}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper no-underline transition hover:bg-moss"
        >
          + Record entry
        </Link>
      </header>

      {txs.length === 0 && <GettingStarted />}

      <section className="grid gap-5 lg:grid-cols-12">
        <HealthScoreCard score={health.score} status={health.status} strongest={strongest} weakest={weakest} />
        <div className="grid grid-cols-2 gap-5 lg:col-span-7">
          <Kpi icon={Wallet} label="Income" value={cur.income} prev={prev.income} delay={80} />
          <Kpi icon={Receipt} label="Spending" value={cur.spending} prev={prev.spending} invert delay={140} />
          <Kpi icon={PiggyBank} label="Moved to savings" value={cur.saved} prev={prev.saved} delay={200} />
          <Kpi icon={Landmark} label="Net worth" value={worth.net} prev={worthPrev} delay={260} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold">Financial health indicators</h2>
          <p className="hidden text-sm text-ink-soft sm:block">Benchmarks used by financial planners</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {health.indicators.map((ind, i) => (
            <IndicatorCard key={ind.id} indicator={ind} delay={i * 60} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <Panel title="Cash flow" subtitle="Income vs. spending, last 6 months" className="lg:col-span-3">
          <div className="h-72">
            <Bar
              data={{
                labels: months.map((m) => formatMonth(m)),
                datasets: [
                  { label: 'Income', data: summaries.map((s) => s.income), backgroundColor: '#1f5c46', borderRadius: 6, maxBarThickness: 26 },
                  { label: 'Spending', data: summaries.map((s) => s.spending), backgroundColor: '#b8573a', borderRadius: 6, maxBarThickness: 26 },
                  { label: 'Saved', data: summaries.map((s) => s.saved), backgroundColor: '#b0833a', borderRadius: 6, maxBarThickness: 26 },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 8 } },
                  tooltip,
                },
                scales: {
                  x: { grid: { display: false }, border: { display: false } },
                  y: { grid: { color: gridColor }, border: { display: false }, ticks: { callback: (v) => `$${Number(v) / 1000}k` } },
                },
              }}
            />
          </div>
        </Panel>

        <Panel title="Where it went" subtitle={`Spending in ${formatMonth(currentMonth, 'long')}`} className="lg:col-span-2">
          <SpendingBreakdown items={cur.byCategory.filter((c) => c.category.bucket !== 'savings')} />
        </Panel>
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <Panel title="Net worth" subtitle={`${formatMoney(worth.assets)} assets · ${formatMoney(worth.debts)} debts`} className="lg:col-span-2">
          <div className="h-56">
            <Line
              data={{
                labels: netWorthHistory.map((p) => formatMonth(p.month)),
                datasets: [
                  {
                    label: 'Net worth',
                    data: netWorthHistory.map((p) => p.value),
                    borderColor: '#1f5c46',
                    backgroundColor: 'rgba(31, 92, 70, 0.1)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                    pointBackgroundColor: '#1f5c46',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip },
                scales: {
                  x: { grid: { display: false }, border: { display: false } },
                  y: { grid: { color: gridColor }, border: { display: false }, ticks: { callback: (v) => `$${Number(v) / 1000}k` } },
                },
              }}
            />
          </div>
        </Panel>

        <Panel
          title="Recent activity"
          subtitle="Latest entries in your ledger"
          className="lg:col-span-3"
          action={
            <Link to="/app/transactions" className="flex items-center gap-1 text-sm font-semibold text-moss no-underline hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {txs.slice(0, 6).map((t) => {
              const c = getCategory(t.categoryId)
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description}</p>
                    <p className="text-xs text-ink-soft">
                      {c.label} · {formatDate(t.date)}
                    </p>
                  </div>
                  <span className={`tabular text-sm font-semibold ${t.type === 'income' ? 'text-moss' : 'text-ink'}`}>
                    {t.type === 'income' ? '+' : '−'}
                    {formatMoney(t.amount, true)}
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </section>
    </div>
  )
}

function GettingStarted() {
  const { loadSample } = useLedgerActions()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setPending(true)
    setError(null)
    try {
      await loadSample()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the sample ledger.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rise flex flex-wrap items-center gap-5 rounded-3xl border border-dashed border-ink/25 bg-card p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brass-soft text-brass">
        <Sparkles className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-semibold">Your ledger is empty</h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          Record your first income or expense, add your savings and debts on the balance sheet, or explore with six months of sample data.
        </p>
        {error && <p className="mt-2 text-sm text-clay">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/app/balance"
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink no-underline transition hover:border-ink"
        >
          Set up balance sheet
        </Link>
        <button
          type="button"
          onClick={load}
          disabled={pending}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-moss disabled:opacity-70"
        >
          {pending ? 'Loading…' : 'Load sample ledger'}
        </button>
      </div>
    </section>
  )
}

function HealthScoreCard({
  score,
  status,
  strongest,
  weakest,
}: {
  score: number
  status: keyof typeof statusStyles
  strongest: Indicator
  weakest: Indicator
}) {
  const r = 54
  const circumference = 2 * Math.PI * r
  const s = statusStyles[status]
  return (
    <div className="rise relative overflow-hidden rounded-3xl bg-ink p-7 text-paper lg:col-span-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-moss/40 blur-3xl" />
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-paper/60">Financial health score</p>
      <div className="mt-5 flex items-center gap-6">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(246,242,233,0.12)" strokeWidth="10" />
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke={status === 'strong' ? '#8fcfae' : status === 'fair' ? '#d9b36a' : '#e58a6c'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular font-display text-5xl font-semibold">{score}</span>
            <span className="text-xs text-paper/60">of 100</span>
          </div>
        </div>
        <div className="space-y-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${s.bg} ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.label}
          </span>
          <p className="text-sm leading-relaxed text-paper/80">
            Strongest: <strong className="text-paper">{strongest.label}</strong> at {strongest.display}.
          </p>
          <p className="text-sm leading-relaxed text-paper/80">
            Focus next: <strong className="text-paper">{weakest.label}</strong> ({weakest.display}, target {weakest.target}).
          </p>
        </div>
      </div>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  prev,
  invert,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  prev: number
  invert?: boolean
  delay: number
}) {
  const change = prev ? (value - prev) / prev : 0
  const up = change >= 0
  const good = invert ? !up : up
  return (
    <div className="rise rounded-3xl border border-line bg-card p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-paper-deep">
          <Icon className="h-4 w-4 text-ink-soft" />
        </span>
        <span className={`flex items-center gap-0.5 text-xs font-bold ${good ? 'text-moss' : 'text-clay'}`}>
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(change * 100).toFixed(1)}%
        </span>
      </div>
      <p className="mt-4 text-sm text-ink-soft">{label}</p>
      <p className="tabular mt-1 font-display text-2xl font-semibold sm:text-3xl">{formatMoney(value)}</p>
    </div>
  )
}

function IndicatorCard({ indicator: ind, delay }: { indicator: Indicator; delay: number }) {
  const s = statusStyles[ind.status]
  return (
    <article
      className="rise group flex flex-col rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_rgba(22,33,28,0.45)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{ind.label}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
      </div>
      <p className="tabular mt-3 font-display text-3xl font-semibold">{ind.display}</p>
      <p className="mt-1 text-xs text-ink-soft">Target {ind.target}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-deep">
        <div className={`h-full rounded-full ${s.dot}`} style={{ width: `${Math.max(4, ind.score)}%` }} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-soft">{ind.explanation}</p>
    </article>
  )
}

function SpendingBreakdown({ items }: { items: { category: { label: string; color: string }; total: number }[] }) {
  const total = items.reduce((s, i) => s + i.total, 0)
  if (!items.length) {
    return <p className="py-10 text-center text-sm text-ink-soft">No spending recorded this month yet.</p>
  }
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <Doughnut
          data={{
            labels: items.map((i) => i.category.label),
            datasets: [{ data: items.map((i) => i.total), backgroundColor: items.map((i) => i.category.color), borderWidth: 2, borderColor: '#fffdf8' }],
          }}
          options={{
            cutout: '70%',
            plugins: {
              legend: { display: false },
              tooltip: { ...tooltip, callbacks: { label: (ctx: any) => ` ${formatMoney(ctx.parsed)}` } },
            },
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular font-display text-xl font-semibold">{formatMoney(total)}</span>
          <span className="text-[11px] text-ink-soft">spent</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {items.slice(0, 6).map((i) => (
          <li key={i.category.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.category.color }} />
            <span className="flex-1 truncate">{i.category.label}</span>
            <span className="tabular text-ink-soft">{Math.round((i.total / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  action,
  className = '',
  children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`rounded-3xl border border-line bg-card p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
