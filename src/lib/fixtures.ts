// Domain types, the default category set, and demo data. Signed-in screens
// read real data through src/lib/store.ts; the demo data here powers the
// landing page preview and the optional "Load sample ledger" action.

export type TransactionType = 'income' | 'expense'

/** 50/30/20 bucket a category counts toward. */
export type Bucket = 'needs' | 'wants' | 'savings'

export interface Category {
  id: string
  label: string
  type: TransactionType
  bucket?: Bucket
  /** Counts toward the debt-to-income ratio. */
  isDebt?: boolean
  /** Counts toward the housing cost ratio. */
  isHousing?: boolean
  color: string
}

export interface Transaction {
  id: string
  date: string // YYYY-MM-DD
  description: string
  amount: number // always positive
  type: TransactionType
  categoryId: string
}

export interface BalanceSheet {
  /** Cash and savings available within days. */
  liquidSavings: number
  investments: number
  otherAssets: number
  debts: { name: string; balance: number; rate: number }[]
}

export interface UserProfile {
  name: string
  email: string
  currency: string
  memberSince: string
}

/** Rows as they are kept on the balance sheet screen. */
export interface Account {
  id: string
  kind: 'savings' | 'investment' | 'asset'
  name: string
  balance: number
}

export interface Debt {
  id: string
  name: string
  balance: number
  rate: number
}

export const categories: Category[] = [
  { id: 'salary', label: 'Salary', type: 'income', color: '#1f5c46' },
  { id: 'freelance', label: 'Freelance', type: 'income', color: '#3f8a6c' },
  { id: 'interest', label: 'Interest & dividends', type: 'income', color: '#8fb8a3' },
  { id: 'housing', label: 'Rent / mortgage', type: 'expense', bucket: 'needs', isHousing: true, color: '#1f5c46' },
  { id: 'utilities', label: 'Utilities', type: 'expense', bucket: 'needs', color: '#3f8a6c' },
  { id: 'groceries', label: 'Groceries', type: 'expense', bucket: 'needs', color: '#b0833a' },
  { id: 'transport', label: 'Transport', type: 'expense', bucket: 'needs', color: '#6b7d73' },
  { id: 'health', label: 'Health & insurance', type: 'expense', bucket: 'needs', color: '#8fb8a3' },
  { id: 'debt', label: 'Loan payments', type: 'expense', bucket: 'needs', isDebt: true, color: '#7a2f1f' },
  { id: 'dining', label: 'Dining out', type: 'expense', bucket: 'wants', color: '#b8573a' },
  { id: 'shopping', label: 'Shopping', type: 'expense', bucket: 'wants', color: '#d98b6a' },
  { id: 'entertainment', label: 'Entertainment', type: 'expense', bucket: 'wants', color: '#e5b9a3' },
  { id: 'travel', label: 'Travel', type: 'expense', bucket: 'wants', color: '#c9a86a' },
  { id: 'savings', label: 'Savings & investing', type: 'expense', bucket: 'savings', color: '#16211c' },
]

export const balanceSheet: BalanceSheet = {
  liquidSavings: 11850,
  investments: 24600,
  otherAssets: 9200,
  debts: [
    { name: 'Car loan', balance: 8400, rate: 5.9 },
    { name: 'Student loan', balance: 14200, rate: 4.3 },
    { name: 'Credit card', balance: 620, rate: 22.9 },
  ],
}

/** The month the dashboard treats as "current". */
export const currentMonth = new Date().toISOString().slice(0, 7)

// The six months ending with the current one, oldest first.
const months = Array.from({ length: 6 }, (_, i) => {
  const [y, m] = currentMonth.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 - (5 - i), 1)).toISOString().slice(0, 7)
})

/** Net worth at the end of each of the previous months, oldest first. */
const worthCurve = [17150, 18020, 18640, 19710, 20480, 22430]
export const netWorthHistory = months.map((month, i) => ({ month, value: worthCurve[i] }))

// Six months of realistic activity: fixed monthly items plus a little
// deterministic variation so the charts have texture.
const wobble = [0, 0.06, -0.04, 0.09, -0.02, 0.03]

function buildTransactions(): Transaction[] {
  const list: Transaction[] = []
  let n = 0
  const add = (
    month: string,
    day: number,
    categoryId: string,
    description: string,
    amount: number,
  ) => {
    const type = categories.find((c) => c.id === categoryId)!.type
    list.push({
      id: `t${++n}`,
      date: `${month}-${String(day).padStart(2, '0')}`,
      description,
      amount: Math.round(amount * 100) / 100,
      type,
      categoryId,
    })
  }

  months.forEach((m, i) => {
    const w = 1 + wobble[i]
    add(m, 1, 'salary', 'Northwind Studio — payroll', 2600)
    add(m, 15, 'salary', 'Northwind Studio — payroll', 2600)
    if (i % 2 === 1) add(m, 21, 'freelance', 'Brand identity project', 850 * w)
    add(m, 28, 'interest', 'High-yield savings interest', 38 + i * 2)

    add(m, 2, 'housing', 'Rent — Maple St. apartment', 1650)
    add(m, 5, 'utilities', 'Electricity & water', 142 * w)
    add(m, 6, 'utilities', 'Internet & phone', 95)
    add(m, 3, 'groceries', 'Green Market', 164 * w)
    add(m, 11, 'groceries', 'Green Market', 138 * w)
    add(m, 19, 'groceries', 'Corner Co-op', 121 * w)
    add(m, 26, 'groceries', 'Green Market', 149 * w)
    add(m, 8, 'transport', 'Fuel', 72 * w)
    add(m, 22, 'transport', 'Transit pass', 64)
    add(m, 4, 'health', 'Health insurance premium', 210)
    add(m, 10, 'debt', 'Car loan payment', 340)
    add(m, 12, 'debt', 'Student loan payment', 185)
    add(m, 9, 'dining', 'Osteria Nove', 68 * w)
    add(m, 17, 'dining', 'Coffee & lunches', 94 * w)
    add(m, 14, 'shopping', 'Online orders', 132 * (1 + wobble[5 - i]))
    add(m, 24, 'entertainment', 'Streaming & concerts', 58 * w)
    if (i === 3) add(m, 18, 'travel', 'Weekend in Lisbon', 780)
    add(m, 16, 'savings', 'Transfer to index fund', 600)
    add(m, 2, 'savings', 'Emergency fund top-up', 250)
  })

  return list.sort((a, b) => b.date.localeCompare(a.date))
}

export const transactions: Transaction[] = buildTransactions()

/** Demo balance sheet split into the rows the balance sheet screen keeps. */
export const sampleAccounts: Omit<Account, 'id'>[] = [
  { kind: 'savings', name: 'Emergency fund', balance: balanceSheet.liquidSavings },
  { kind: 'investment', name: 'Index fund', balance: balanceSheet.investments },
  { kind: 'asset', name: 'Car', balance: balanceSheet.otherAssets },
]
