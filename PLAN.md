# Ledgerwise roadmap

Ledgerwise is a personal ledger for recording income and expenses and monitoring financial health through planner-grade indicators, behind a private login. The work is split into small, self-contained milestones.

## 1. Product surface ✅
- Branded landing page (`/`) explaining the product and the indicators.
- Sign-in / create-account screen (`/login`) with validation (opens the demo ledger for now).
- Overview dashboard (`/app`): health score, income/spending/savings/net-worth KPIs, five indicator cards, cash-flow, spending mix and net-worth charts, recent activity.
- Transactions ledger (`/app/transactions`): filter by type and month, search, delete, and a "Record entry" form with validation.
- All data comes from `src/lib/fixtures.ts` through `src/lib/store.ts`; indicator math lives in `src/lib/finance.ts`.

## 2. Accounts and login
- Real sign-up, sign-in, sign-out and password reset (Netlify Identity).
- Protect every `/app` route and redirect signed-out visitors to `/login`.
- Show the signed-in user's name and email in the sidebar in place of the demo profile.

## 3. Data model and persistence
- Postgres tables for `transactions`, `categories` (defaults plus custom ones per user), `accounts` (savings, investments, assets) and `debts`, each scoped to the user.
- **Database choice:** the original request named Supabase. This plan uses Netlify Database, the managed Postgres built into the Netlify project, with Drizzle ORM. It is the same relational Postgres model without a separate account or API keys to manage. The schema is plain Postgres, so an existing Supabase project could be used instead if that's preferred.
- Seed each new account with the default categories.

## 4. Ledger API
- Server functions to list, create, edit and delete transactions, with server-side validation.
- Replace the in-memory store in `src/lib/store.ts` with these calls, keeping the same hook API so screens don't change.
- Add editing of existing entries and CSV import/export.

## 5. Balance sheet and net worth
- Screen to maintain savings, investments, assets and debts (balance, interest rate, minimum payment).
- Monthly net-worth snapshots to power the trend chart with real history.
- Feed liquid savings and debt payments into the emergency-fund and debt-to-income indicators.

## 6. Budgets and goals
- Monthly budgets per category with progress bars and overspend alerts.
- Savings goals (emergency fund, down payment…) with target dates.
- Recurring transactions (salary, rent, subscriptions) that post automatically.

## 7. Insights and polish
- Month-over-month health score history and short explanations of what changed.
- Extra indicators: liquidity ratio, credit utilisation, investment rate.
- Multi-currency profiles, settings page, dark mode, and account deletion / data export.
