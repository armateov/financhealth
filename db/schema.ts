import { bigint, date, index, pgTable, real, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

// Money is stored as whole cents so sums stay exact. Amounts are always
// positive; `type` decides the sign.

/** One row per Netlify Identity account, created on first sign-in. */
export const users = pgTable('users', {
  id: text().primaryKey(), // Netlify Identity user id
  email: text().notNull(),
  name: text().notNull().default(''),
  currency: text().notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const transactions = pgTable(
  'transactions',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date({ mode: 'string' }).notNull(),
    description: text().notNull(),
    amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
    type: text({ enum: ['income', 'expense'] }).notNull(),
    categoryId: text('category_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('transactions_user_date_idx').on(t.userId, t.date)],
)

/** Savings, investment and other asset accounts on the balance sheet. */
export const accounts = pgTable(
  'accounts',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text({ enum: ['savings', 'investment', 'asset'] }).notNull(),
    name: text().notNull(),
    balanceCents: bigint('balance_cents', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
)

export const debts = pgTable(
  'debts',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    balanceCents: bigint('balance_cents', { mode: 'number' }).notNull(),
    /** Annual interest rate in percent, e.g. 5.9. */
    rate: real().notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('debts_user_idx').on(t.userId)],
)

/** Net worth at the end of each month, refreshed whenever the ledger loads. */
export const netWorthSnapshots = pgTable(
  'net_worth_snapshots',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    month: text().notNull(), // YYYY-MM
    valueCents: bigint('value_cents', { mode: 'number' }).notNull(),
  },
  (t) => [uniqueIndex('net_worth_user_month_idx').on(t.userId, t.month)],
)
