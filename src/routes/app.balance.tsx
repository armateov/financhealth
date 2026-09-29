import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Account } from '@/lib/fixtures'
import { formatMoney, netWorth } from '@/lib/finance'
import { useLedger, useLedgerActions } from '@/lib/store'

export const Route = createFileRoute('/app/balance')({
  head: () => ({ meta: [{ title: 'Balance sheet — Ledgerwise' }] }),
  component: BalanceSheetPage,
})

const kindLabels: Record<Account['kind'], string> = {
  savings: 'Cash & savings',
  investment: 'Investments',
  asset: 'Other assets',
}

const field = 'w-full rounded-xl border border-line bg-card px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10'

function BalanceSheetPage() {
  const { accounts, debts, balanceSheet } = useLedger()
  const { removeAccount, removeDebt } = useLedgerActions()
  const worth = netWorth(balanceSheet)

  return (
    <div className="space-y-7">
      <header className="rise">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink-soft">What you own and owe</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Balance sheet</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Cash and savings feed your emergency-fund indicator; everything here adds up to your net worth, which is
          recorded each month to build your trend.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Assets" value={worth.assets} tone="text-moss" />
        <Stat label="Debts" value={worth.debts} tone="text-clay" />
        <Stat label="Net worth" value={worth.net} tone={worth.net >= 0 ? 'text-ink' : 'text-clay'} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Assets</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Savings accounts, investments and things of value.</p>
          <Rows
            empty="No assets yet."
            items={accounts.map((a) => ({ id: a.id, name: a.name, detail: kindLabels[a.kind], balance: a.balance }))}
            onRemove={removeAccount}
          />
          <AccountForm />
        </section>

        <section className="rounded-3xl border border-line bg-card p-6">
          <h2 className="font-display text-xl font-semibold">Debts</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Loans and card balances you still owe.</p>
          <Rows
            empty="No debts recorded."
            items={debts.map((d) => ({ id: d.id, name: d.name, detail: `${d.rate}% APR`, balance: d.balance }))}
            onRemove={removeDebt}
            negative
          />
          <DebtForm />
        </section>
      </div>
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

function Rows({
  items,
  empty,
  onRemove,
  negative,
}: {
  items: { id: string; name: string; detail: string; balance: number }[]
  empty: string
  onRemove: (id: string) => Promise<unknown>
  negative?: boolean
}) {
  const [deleting, setDeleting] = useState<string | null>(null)
  if (!items.length) return <p className="py-8 text-center text-sm text-ink-soft">{empty}</p>
  return (
    <ul className="mt-4 divide-y divide-line">
      {items.map((i) => (
        <li key={i.id} className="group flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{i.name}</p>
            <p className="text-xs text-ink-soft">{i.detail}</p>
          </div>
          <span className={`tabular text-sm font-semibold ${negative ? 'text-clay' : 'text-ink'}`}>
            {formatMoney(i.balance, true)}
          </span>
          <button
            type="button"
            disabled={deleting === i.id}
            onClick={async () => {
              setDeleting(i.id)
              try {
                await onRemove(i.id)
              } finally {
                setDeleting(null)
              }
            }}
            className="rounded-lg p-1.5 text-ink-soft opacity-0 transition hover:bg-clay-soft hover:text-clay focus:opacity-100 group-hover:opacity-100"
            aria-label={`Remove ${i.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}

function useSubmit(save: () => Promise<unknown>, reset: () => void) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async () => {
    setPending(true)
    setError(null)
    try {
      await save()
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.')
    } finally {
      setPending(false)
    }
  }
  return { pending, error, setError, submit }
}

function AccountForm() {
  const { addAccount } = useLedgerActions()
  const [kind, setKind] = useState<Account['kind']>('savings')
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const { pending, error, setError, submit } = useSubmit(
    () => addAccount({ kind, name: name.trim(), balance: Math.round(Number(balance) * 100) / 100 }),
    () => {
      setName('')
      setBalance('')
    },
  )

  return (
    <form
      noValidate
      className="mt-4 space-y-3 border-t border-line pt-4"
      onSubmit={(e) => {
        e.preventDefault()
        const value = Number(balance)
        if (!name.trim()) return setError('Give the account a name.')
        if (!balance || !Number.isFinite(value) || value < 0) return setError('Enter a balance of zero or more.')
        submit()
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. High-yield savings" className={field} aria-label="Account name" />
        <select value={kind} onChange={(e) => setKind(e.target.value as Account['kind'])} className={field} aria-label="Account type">
          {Object.entries(kindLabels).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <input inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance" className={`${field} tabular`} aria-label="Balance" />
        <AddButton pending={pending} />
      </div>
      {error && <p className="text-xs text-clay">{error}</p>}
    </form>
  )
}

function DebtForm() {
  const { addDebt } = useLedgerActions()
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [rate, setRate] = useState('')
  const { pending, error, setError, submit } = useSubmit(
    () => addDebt({ name: name.trim(), balance: Math.round(Number(balance) * 100) / 100, rate: Number(rate || 0) }),
    () => {
      setName('')
      setBalance('')
      setRate('')
    },
  )

  return (
    <form
      noValidate
      className="mt-4 space-y-3 border-t border-line pt-4"
      onSubmit={(e) => {
        e.preventDefault()
        const value = Number(balance)
        const apr = Number(rate || 0)
        if (!name.trim()) return setError('Give the debt a name.')
        if (!balance || !Number.isFinite(value) || value < 0) return setError('Enter a balance of zero or more.')
        if (!Number.isFinite(apr) || apr < 0 || apr > 100) return setError('Interest rate must be between 0 and 100.')
        submit()
      }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Car loan" className={field} aria-label="Debt name" />
      <div className="flex gap-3">
        <input inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance owed" className={`${field} tabular`} aria-label="Balance owed" />
        <input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="APR %" className={`${field} tabular w-28`} aria-label="Interest rate" />
        <AddButton pending={pending} />
      </div>
      {error && <p className="text-xs text-clay">{error}</p>}
    </form>
  )
}

function AddButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-moss disabled:opacity-70"
    >
      <Plus className="h-4 w-4" /> {pending ? 'Adding…' : 'Add'}
    </button>
  )
}
