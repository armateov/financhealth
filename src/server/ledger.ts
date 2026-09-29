import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { accounts, debts, netWorthSnapshots, transactions, users } from '../../db/schema.js'
import { requireAuthMiddleware } from '@/middleware/identity'
import {
  categories,
  currentMonth,
  netWorthHistory as sampleWorth,
  sampleAccounts,
  balanceSheet as sampleBalance,
  transactions as sampleTransactions,
  type Account,
  type BalanceSheet,
  type Debt,
  type Transaction,
  type TransactionType,
  type UserProfile,
} from '@/lib/fixtures'

export interface Ledger {
  profile: UserProfile
  transactions: Transaction[]
  accounts: Account[]
  debts: Debt[]
  balanceSheet: BalanceSheet
  netWorthHistory: { month: string; value: number }[]
}

const toCents = (n: number) => Math.round(n * 100)
const fromCents = (n: number) => n / 100

function toBalanceSheet(accs: Account[], dbts: Debt[]): BalanceSheet {
  const sum = (kind: Account['kind']) => accs.filter((a) => a.kind === kind).reduce((s, a) => s + a.balance, 0)
  return {
    liquidSavings: sum('savings'),
    investments: sum('investment'),
    otherAssets: sum('asset'),
    debts: dbts.map((d) => ({ name: d.name, balance: d.balance, rate: d.rate })),
  }
}

// ── Validation ───────────────────────────────────────────────────────────

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
const isAmount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e11
const text = (v: unknown, field: string, max = 200) => {
  if (typeof v !== 'string' || !v.trim()) throw new Error(`${field} is required.`)
  return v.trim().slice(0, max)
}

function validateTransaction(input: unknown): Omit<Transaction, 'id'> {
  const d = (input ?? {}) as Record<string, unknown>
  const type = d.type as TransactionType
  if (type !== 'income' && type !== 'expense') throw new Error('Type must be income or expense.')
  if (!isAmount(d.amount) || d.amount <= 0) throw new Error('Amount must be greater than zero.')
  if (!isDate(d.date)) throw new Error('Date must be YYYY-MM-DD.')
  const category = categories.find((c) => c.id === d.categoryId)
  if (!category || category.type !== type) throw new Error('Unknown category for this entry type.')
  return { type, amount: d.amount, date: d.date, categoryId: category.id, description: text(d.description, 'Description') }
}

const byId = (input: unknown) => {
  const id = (input as { id?: unknown })?.id
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid id.')
  return { id }
}

// ── Reads ────────────────────────────────────────────────────────────────

/**
 * Everything the signed-in screens need. Creates the user's row on first
 * sign-in and records this month's net worth so the trend builds up.
 */
export const getLedger = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }): Promise<Ledger> => {
    const { user } = context
    const [profile] = await db
      .insert(users)
      .values({ id: user.id, email: user.email ?? '', name: user.name ?? '' })
      .onConflictDoUpdate({
        target: users.id,
        set: { email: user.email ?? '', ...(user.name ? { name: user.name } : {}), updatedAt: new Date() },
      })
      .returning()

    const [txRows, accRows, debtRows] = await Promise.all([
      db.select().from(transactions).where(eq(transactions.userId, user.id)).orderBy(desc(transactions.date), desc(transactions.createdAt)),
      db.select().from(accounts).where(eq(accounts.userId, user.id)).orderBy(asc(accounts.createdAt)),
      db.select().from(debts).where(eq(debts.userId, user.id)).orderBy(asc(debts.createdAt)),
    ])

    const accs: Account[] = accRows.map((a) => ({ id: a.id, kind: a.kind, name: a.name, balance: fromCents(a.balanceCents) }))
    const dbts: Debt[] = debtRows.map((d) => ({ id: d.id, name: d.name, balance: fromCents(d.balanceCents), rate: d.rate }))
    const balanceSheet = toBalanceSheet(accs, dbts)
    const net = accs.reduce((s, a) => s + a.balance, 0) - dbts.reduce((s, d) => s + d.balance, 0)

    await db
      .insert(netWorthSnapshots)
      .values({ userId: user.id, month: currentMonth, valueCents: toCents(net) })
      .onConflictDoUpdate({ target: [netWorthSnapshots.userId, netWorthSnapshots.month], set: { valueCents: toCents(net) } })

    const history = await db
      .select()
      .from(netWorthSnapshots)
      .where(eq(netWorthSnapshots.userId, user.id))
      .orderBy(desc(netWorthSnapshots.month))
      .limit(6)

    return {
      profile: {
        name: profile.name,
        email: profile.email,
        currency: profile.currency,
        memberSince: profile.createdAt.toISOString().slice(0, 10),
      },
      transactions: txRows.map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: fromCents(t.amountCents),
        type: t.type,
        categoryId: t.categoryId,
      })),
      accounts: accs,
      debts: dbts,
      balanceSheet,
      netWorthHistory: history.reverse().map((h) => ({ month: h.month, value: fromCents(h.valueCents) })),
    }
  })

// ── Transactions ─────────────────────────────────────────────────────────

export const createTransaction = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(validateTransaction)
  .handler(async ({ context, data }): Promise<Transaction> => {
    const [row] = await db
      .insert(transactions)
      .values({
        userId: context.user.id,
        date: data.date,
        description: data.description,
        amountCents: toCents(data.amount),
        type: data.type,
        categoryId: data.categoryId,
      })
      .returning()
    return { ...data, id: row.id }
  })

export const deleteTransaction = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(byId)
  .handler(async ({ context, data }) => {
    await db.delete(transactions).where(and(eq(transactions.id, data.id), eq(transactions.userId, context.user.id)))
  })

// ── Balance sheet ────────────────────────────────────────────────────────

export const createAccount = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator((input: unknown) => {
    const d = (input ?? {}) as Record<string, unknown>
    if (d.kind !== 'savings' && d.kind !== 'investment' && d.kind !== 'asset') throw new Error('Unknown account type.')
    if (!isAmount(d.balance)) throw new Error('Balance must be zero or more.')
    return { kind: d.kind, name: text(d.name, 'Name', 80), balance: d.balance } as Omit<Account, 'id'>
  })
  .handler(async ({ context, data }) => {
    await db.insert(accounts).values({ userId: context.user.id, kind: data.kind, name: data.name, balanceCents: toCents(data.balance) })
  })

export const deleteAccount = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(byId)
  .handler(async ({ context, data }) => {
    await db.delete(accounts).where(and(eq(accounts.id, data.id), eq(accounts.userId, context.user.id)))
  })

export const createDebt = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator((input: unknown) => {
    const d = (input ?? {}) as Record<string, unknown>
    if (!isAmount(d.balance)) throw new Error('Balance must be zero or more.')
    if (typeof d.rate !== 'number' || !Number.isFinite(d.rate) || d.rate < 0 || d.rate > 100) throw new Error('Rate must be between 0 and 100.')
    return { name: text(d.name, 'Name', 80), balance: d.balance, rate: d.rate } as Omit<Debt, 'id'>
  })
  .handler(async ({ context, data }) => {
    await db.insert(debts).values({ userId: context.user.id, name: data.name, balanceCents: toCents(data.balance), rate: data.rate })
  })

export const deleteDebt = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(byId)
  .handler(async ({ context, data }) => {
    await db.delete(debts).where(and(eq(debts.id, data.id), eq(debts.userId, context.user.id)))
  })

// ── Sample data ──────────────────────────────────────────────────────────

/** Fills an empty ledger with six months of demo activity and a balance sheet. */
export const loadSampleLedger = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const userId = context.user.id
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(eq(transactions.userId, userId))
    if (count > 0) throw new Error('Sample data can only be loaded into an empty ledger.')

    const today = new Date().toISOString().slice(0, 10)
    await db.insert(transactions).values(
      sampleTransactions
        .filter((t) => t.date <= today)
        .map((t) => ({ userId, date: t.date, description: t.description, amountCents: toCents(t.amount), type: t.type, categoryId: t.categoryId })),
    )
    await db.insert(accounts).values(sampleAccounts.map((a) => ({ userId, kind: a.kind, name: a.name, balanceCents: toCents(a.balance) })))
    await db.insert(debts).values(sampleBalance.debts.map((d) => ({ userId, name: d.name, balanceCents: toCents(d.balance), rate: d.rate })))
    await db
      .insert(netWorthSnapshots)
      .values(sampleWorth.map((p) => ({ userId, month: p.month, valueCents: toCents(p.value) })))
      .onConflictDoUpdate({ target: [netWorthSnapshots.userId, netWorthSnapshots.month], set: { valueCents: sql`excluded.value_cents` } })
  })
