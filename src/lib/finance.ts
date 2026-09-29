import type { BalanceSheet, Bucket, Category, Transaction } from './fixtures'
import { categories } from './fixtures'

export type Status = 'strong' | 'fair' | 'weak'

export interface Indicator {
  id: string
  label: string
  value: number
  display: string
  target: string
  status: Status
  /** 0–100 contribution to the overall health score. */
  score: number
  weight: number
  explanation: string
}

export interface MonthSummary {
  month: string
  income: number
  /** Spending on consumption (everything except the savings bucket). */
  spending: number
  /** Money moved into savings / investments. */
  saved: number
  buckets: Record<Bucket, number>
  debtPayments: number
  housing: number
  byCategory: { category: Category; total: number }[]
}

const categoryMap = new Map(categories.map((c) => [c.id, c]))
export const getCategory = (id: string) => categoryMap.get(id)!

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n))
/** Linear score: `best` maps to 100, `worst` maps to 0. */
const lerpScore = (v: number, best: number, worst: number) =>
  clamp(((v - worst) / (best - worst)) * 100)

export const monthKey = (date: string) => date.slice(0, 7)

export function previousMonths(month: string, count: number) {
  const [y, m] = month.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (count - 1 - i), 1))
    return d.toISOString().slice(0, 7)
  })
}

export function summarizeMonth(txs: Transaction[], month: string): MonthSummary {
  const s: MonthSummary = {
    month,
    income: 0,
    spending: 0,
    saved: 0,
    buckets: { needs: 0, wants: 0, savings: 0 },
    debtPayments: 0,
    housing: 0,
    byCategory: [],
  }
  const totals = new Map<string, number>()
  for (const t of txs) {
    if (monthKey(t.date) !== month) continue
    const c = getCategory(t.categoryId)
    if (t.type === 'income') {
      s.income += t.amount
      continue
    }
    totals.set(c.id, (totals.get(c.id) ?? 0) + t.amount)
    if (c.bucket) s.buckets[c.bucket] += t.amount
    if (c.bucket === 'savings') s.saved += t.amount
    else s.spending += t.amount
    if (c.isDebt) s.debtPayments += t.amount
    if (c.isHousing) s.housing += t.amount
  }
  s.byCategory = [...totals.entries()]
    .map(([id, total]) => ({ category: getCategory(id), total }))
    .sort((a, b) => b.total - a.total)
  return s
}

export function netWorth(b: BalanceSheet) {
  const assets = b.liquidSavings + b.investments + b.otherAssets
  const debts = b.debts.reduce((sum, d) => sum + d.balance, 0)
  return { assets, debts, net: assets - debts }
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`

function statusFor(score: number): Status {
  return score >= 75 ? 'strong' : score >= 45 ? 'fair' : 'weak'
}

/**
 * Core personal finance indicators, computed for `month` using the
 * widely used planner benchmarks (20% savings rate, 3–6 months of emergency
 * cover, DTI under 36%, housing under 28%, the 50/30/20 split).
 */
export function computeIndicators(
  txs: Transaction[],
  balance: BalanceSheet,
  month: string,
): { indicators: Indicator[]; score: number; status: Status } {
  const cur = summarizeMonth(txs, month)
  const recent = previousMonths(month, 3).map((m) => summarizeMonth(txs, m))
  const avgNeeds =
    recent.reduce((sum, r) => sum + r.buckets.needs, 0) / recent.length || 1
  const income = cur.income || 1

  const savingsRate = (cur.income - cur.spending) / income
  const emergencyMonths = balance.liquidSavings / avgNeeds
  const dti = (cur.debtPayments + cur.housing) / income
  const housingRatio = cur.housing / income
  const needsShare = cur.buckets.needs / income
  const wantsShare = cur.buckets.wants / income
  const savingsShare = 1 - needsShare - wantsShare
  const budgetDrift =
    Math.max(0, needsShare - 0.5) +
    Math.max(0, wantsShare - 0.3) +
    Math.max(0, 0.2 - savingsShare)

  const raw: Omit<Indicator, 'status'>[] = [
    {
      id: 'savings-rate',
      label: 'Savings rate',
      value: savingsRate,
      display: pct(savingsRate),
      target: '≥ 20% of income',
      score: lerpScore(savingsRate, 0.25, 0),
      weight: 25,
      explanation:
        'Share of income left after all consumption spending. The single best predictor of long-term wealth.',
    },
    {
      id: 'emergency-fund',
      label: 'Emergency fund',
      value: emergencyMonths,
      display: `${emergencyMonths.toFixed(1)} mo`,
      target: '3–6 months of essentials',
      score: lerpScore(emergencyMonths, 6, 0),
      weight: 25,
      explanation:
        'How many months your liquid savings would cover essential ("needs") spending if income stopped.',
    },
    {
      id: 'dti',
      label: 'Debt-to-income',
      value: dti,
      display: pct(dti),
      target: '≤ 36% of income',
      score: lerpScore(dti, 0.2, 0.5),
      weight: 20,
      explanation:
        'Housing plus loan payments as a share of income. Lenders treat anything above 43% as high risk.',
    },
    {
      id: 'housing',
      label: 'Housing cost ratio',
      value: housingRatio,
      display: pct(housingRatio),
      target: '≤ 28% of income',
      score: lerpScore(housingRatio, 0.2, 0.45),
      weight: 15,
      explanation:
        'Rent or mortgage as a share of income. Above 30% is considered cost-burdened.',
    },
    {
      id: 'budget-split',
      label: '50/30/20 balance',
      value: budgetDrift,
      display: `${Math.round(needsShare * 100)}/${Math.round(wantsShare * 100)}/${Math.round(savingsShare * 100)}`,
      target: '50 needs · 30 wants · 20 saved',
      score: clamp(100 - budgetDrift * 300),
      weight: 15,
      explanation:
        'How closely your spending follows the 50/30/20 rule for needs, wants and savings.',
    },
  ]

  const indicators = raw.map((i) => ({ ...i, status: statusFor(i.score) }))
  const totalWeight = indicators.reduce((s, i) => s + i.weight, 0)
  const score = Math.round(
    indicators.reduce((s, i) => s + i.score * i.weight, 0) / totalWeight,
  )
  return { indicators, score, status: statusFor(score) }
}

export const statusStyles: Record<Status, { label: string; text: string; bg: string; dot: string }> = {
  strong: { label: 'Healthy', text: 'text-moss', bg: 'bg-moss-soft', dot: 'bg-moss' },
  fair: { label: 'Watch', text: 'text-brass', bg: 'bg-brass-soft', dot: 'bg-brass' },
  weak: { label: 'At risk', text: 'text-clay', bg: 'bg-clay-soft', dot: 'bg-clay' },
}

const moneyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const moneyFmtCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

export const formatMoney = (n: number, cents = false) =>
  (cents ? moneyFmtCents : moneyFmt).format(n)

export const formatMonth = (month: string, style: 'short' | 'long' = 'short') =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-US', {
    month: style,
    year: style === 'long' ? 'numeric' : undefined,
    timeZone: 'UTC',
  })

export const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
