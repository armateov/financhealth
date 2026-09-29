# AGENTS.md

Ledgerwise is an income/expense ledger with personal financial-health indicators, built with TanStack Start and deployed on Netlify.

**Continue from [PLAN.md](./PLAN.md).** Milestone 1 (product surface) is done. Work through the next milestones in order.

## Tech stack

TanStack Start + TanStack Router (file-based), React 19, Vite 7, Tailwind CSS 4, Chart.js (`react-chartjs-2`), lucide-react icons, TypeScript strict mode, `@/` alias → `src/`.

## Structure

```
src/
  routes/
    __root.tsx              # HTML shell, meta, fonts (Fraunces + Manrope), favicon
    index.tsx               # Landing page
    login.tsx               # Sign in / create account (stub: navigates to /app)
    app.tsx                 # Layout for /app/*: wraps children in AppShell
    app.index.tsx           # Overview dashboard (score, KPIs, indicators, charts)
    app.transactions.tsx    # Ledger + "Record entry" modal (?add=true opens it)
  components/
    AppShell.tsx            # Sidebar/mobile nav for the app area
    Logo.tsx                # Logo mark + wordmark
  lib/
    fixtures.ts             # ALL demo data + domain types (Transaction, Category, BalanceSheet)
    store.ts                # In-memory client ledger (useTransactions/addTransaction/removeTransaction)
    finance.ts              # Pure indicator math, health score, formatters
```

## Key decisions

- **Stubs are isolated.** Screens never import fixture transactions directly (apart from the landing page preview). They use `useTransactions()` from `lib/store.ts`. When persistence arrives, keep that hook's shape and back it with server functions and the database.
- **Indicator logic is pure** (`computeIndicators` in `lib/finance.ts`) so it can run on the server or client. Benchmarks: savings rate ≥20%, emergency fund 3–6 months of "needs" spending, DTI (housing + debt payments) ≤36%, housing ≤28%, 50/30/20 split. The health score is a weighted average (25/25/20/15/15).
- **Categories carry semantics:** `bucket` (needs/wants/savings), `isDebt`, `isHousing`. Transfers to the `savings` bucket count as saved money, not spending.
- **Database:** the user asked for Supabase. The plan uses Netlify Database (managed Postgres + Drizzle, schema in `db/schema.ts`) per platform conventions, and PLAN.md explains this. Auth is planned with Netlify Identity.
- Amounts are always positive. `type` decides the sign.

## Conventions

- Theme tokens are defined in `@theme` in `src/styles.css` (`paper`, `card`, `ink`, `ink-soft`, `line`, `moss` = income/positive, `clay` = expense/negative, `brass` = savings/warning). Use them instead of raw colors.
- Headings use `font-display`, numbers use the `tabular` class, and entrance motion uses `.rise` with an inline `animationDelay`.
- Components are PascalCase and routes are TanStack file-route names (`app.transactions.tsx` → `/app/transactions`).
