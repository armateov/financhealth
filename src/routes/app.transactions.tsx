import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Search, Trash2, X, Plus, Check } from 'lucide-react'
import { categories, currentMonth, type TransactionType } from '@/lib/fixtures'
import { formatDate, formatMoney, formatMonth, getCategory, monthKey } from '@/lib/finance'
import { useLedgerActions, useTransactions } from '@/lib/store'

export const Route = createFileRoute('/app/transactions')({
  validateSearch: (search: Record<string, unknown>): { add?: boolean } => ({
    add: search.add === true || search.add === 'true' ? true : undefined,
  }),
  component: Transactions,
})

type Filter = 'all' | TransactionType

function Transactions() {
  const txs = useTransactions()
  const { removeTransaction } = useLedgerActions()
  const { add } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [filter, setFilter] = useState<Filter>('all')
  const [month, setMonth] = useState<string>(currentMonth)
  const [query, setQuery] = useState('')
  const [flash, setFlash] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const months = useMemo(
    () => [...new Set([currentMonth, ...txs.map((t) => monthKey(t.date))])].sort().reverse(),
    [txs],
  )

  const visible = txs.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false
    if (month !== 'all' && monthKey(t.date) !== month) return false
    if (query) {
      const q = query.toLowerCase()
      return t.description.toLowerCase().includes(q) || getCategory(t.categoryId).label.toLowerCase().includes(q)
    }
    return true
  })

  const income = visible.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = visible.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const grouped = useMemo(() => {
    const map = new Map<string, typeof visible>()
    for (const t of visible) map.set(t.date, [...(map.get(t.date) ?? []), t])
    return [...map.entries()]
  }, [visible])

  const closeForm = () => navigate({ search: {} })

  const remove = async (id: string) => {
    setDeleting(id)
    try {
      await removeTransaction(id)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-7">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-soft">Ledger</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Transactions</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate({ search: { add: true } })}
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-moss"
        >
          <Plus className="h-4 w-4" /> Record entry
        </button>
      </header>

      {flash && (
        <div className="rise flex items-center gap-2 rounded-2xl border border-moss/30 bg-moss-soft px-4 py-3 text-sm font-medium text-moss">
          <Check className="h-4 w-4" /> {flash}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Income" value={income} tone="text-moss" />
        <Stat label="Expenses" value={expenses} tone="text-clay" />
        <Stat label="Net" value={income - expenses} tone={income - expenses >= 0 ? 'text-ink' : 'text-clay'} />
      </section>

      <section className="rounded-3xl border border-line bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="flex rounded-full bg-paper-deep p-1 text-sm font-semibold">
            {(['all', 'income', 'expense'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 capitalize transition ${filter === f ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}
              >
                {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expenses'}
              </button>
            ))}
          </div>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium focus:border-ink focus:outline-none"
            aria-label="Month"
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m, 'long')}
              </option>
            ))}
          </select>
          <label className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries"
              className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm placeholder:text-ink-soft/70 focus:border-ink focus:outline-none"
            />
          </label>
        </div>

        {grouped.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-ink-soft">Try another filter, or record your first entry for this period.</p>
          </div>
        ) : (
          <div>
            {grouped.map(([date, items]) => (
              <div key={date}>
                <p className="bg-paper/60 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {formatDate(date)}
                </p>
                <ul className="divide-y divide-line">
                  {items.map((t) => {
                    const c = getCategory(t.categoryId)
                    return (
                      <li key={t.id} className="group flex items-center gap-4 px-5 py-3.5 transition hover:bg-paper/50">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                          style={{ background: c.color }}
                        >
                          {c.label.slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.description}</p>
                          <p className="text-xs text-ink-soft">
                            {c.label}
                            {c.bucket && <span className="ml-1.5 rounded bg-paper-deep px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{c.bucket}</span>}
                          </p>
                        </div>
                        <span className={`tabular text-sm font-semibold ${t.type === 'income' ? 'text-moss' : 'text-ink'}`}>
                          {t.type === 'income' ? '+' : '−'}
                          {formatMoney(t.amount, true)}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(t.id)}
                          disabled={deleting === t.id}
                          className="rounded-lg p-1.5 text-ink-soft opacity-0 transition hover:bg-clay-soft hover:text-clay focus:opacity-100 group-hover:opacity-100"
                          aria-label={`Delete ${t.description}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {add && (
        <EntryForm
          onClose={closeForm}
          onSaved={(desc, date) => {
            closeForm()
            setMonth(monthKey(date))
            setFilter('all')
            setFlash(`Recorded “${desc}”. Your indicators have been updated.`)
            setTimeout(() => setFlash(null), 4000)
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rise rounded-2xl border border-line bg-card px-5 py-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`tabular mt-1 font-display text-2xl font-semibold ${tone}`}>{formatMoney(value, true)}</p>
    </div>
  )
}

function EntryForm({ onClose, onSaved }: { onClose: () => void; onSaved: (desc: string, date: string) => void }) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('groceries')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const { addTransaction } = useLedgerActions()

  const options = categories.filter((c) => c.type === type)

  const switchType = (t: TransactionType) => {
    setType(t)
    setCategoryId(categories.find((c) => c.type === t)!.id)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const value = Number(amount)
    if (!amount || !Number.isFinite(value) || value <= 0) next.amount = 'Enter an amount greater than zero.'
    if (!description.trim()) next.description = 'Add a short description.'
    if (!date) next.date = 'Pick a date.'
    setErrors(next)
    if (Object.keys(next).length) return
    setPending(true)
    try {
      await addTransaction({ type, amount: Math.round(value * 100) / 100, description: description.trim(), categoryId, date })
      onSaved(description.trim(), date)
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Could not save this entry. Try again.' })
    } finally {
      setPending(false)
    }
  }

  const field = 'w-full rounded-xl border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={submit}
        className="rise relative w-full max-w-md rounded-t-3xl bg-paper p-6 shadow-2xl sm:rounded-3xl"
        noValidate
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Record an entry</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-paper-deep" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-paper-deep p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={`rounded-xl py-2 text-sm font-semibold transition ${
                type === t ? (t === 'income' ? 'bg-moss text-paper' : 'bg-clay text-paper') : 'text-ink-soft hover:text-ink'
              }`}
            >
              {t === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Amount</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg text-ink-soft">$</span>
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${field} tabular pl-9 font-display text-lg ${errors.amount ? 'border-clay' : 'border-line'}`}
              />
            </div>
            {errors.amount && <span className="mt-1 block text-xs text-clay">{errors.amount}</span>}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'income' ? 'e.g. Monthly salary' : 'e.g. Weekly groceries'}
              className={`${field} ${errors.description ? 'border-clay' : 'border-line'}`}
            />
            {errors.description && <span className="mt-1 block text-xs text-clay">{errors.description}</span>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Category</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${field} border-line`}>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${field} ${errors.date ? 'border-clay' : 'border-line'}`}
              />
              {errors.date && <span className="mt-1 block text-xs text-clay">{errors.date}</span>}
            </label>
          </div>
        </div>

        {errors.form && <p className="mt-4 text-sm text-clay">{errors.form}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-xl bg-ink py-3 text-sm font-semibold text-paper transition hover:bg-moss disabled:opacity-70"
        >
          {pending ? 'Saving…' : `Save ${type}`}
        </button>
      </form>
    </div>
  )
}
