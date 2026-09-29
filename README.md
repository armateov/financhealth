# Ledgerwise

Ledgerwise lets you record income and expenses and keep an eye on your financial health. Every entry feeds five personal-finance indicators (savings rate, emergency-fund coverage, debt-to-income, housing cost ratio and the 50/30/20 balance), which roll up into a single 0–100 health score.

## Screens

- `/`: landing page
- `/login`: sign in / create account
- `/app`: overview dashboard with health score, KPIs, indicators and charts
- `/app/transactions`: the ledger, with filters, search and a form to record entries

The screens currently run on realistic demo data (`src/lib/fixtures.ts`). Entries you record show up immediately on the dashboard, but they are kept in memory for now.

## Tech

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) on Vite 7
- Tailwind CSS 4 with a custom theme (`src/styles.css`)
- Chart.js via `react-chartjs-2`
- Deployed on Netlify

## Run locally

```bash
pnpm install
netlify dev    # or: pnpm dev
```

## Roadmap

See [PLAN.md](./PLAN.md). Next up: real accounts and login, a Postgres data model (Netlify Database), a ledger API that replaces the demo data, and then balance-sheet tracking, budgets and goals.
