import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useMemo } from 'react'
import type { Account, Debt, Transaction } from './fixtures'
import {
  createAccount,
  createDebt,
  createTransaction,
  deleteAccount,
  deleteDebt,
  deleteTransaction,
  loadSampleLedger,
  type Ledger,
} from '@/server/ledger'

// The signed-in user's ledger, loaded by the /app layout from Netlify
// Database. Mutations call server functions and then reload the layout's
// data so every screen and indicator reflects the change.

const appRoute = getRouteApi('/app')

export function useLedger(): Ledger {
  return appRoute.useLoaderData()
}

export function useTransactions() {
  return useLedger().transactions
}

export function useLedgerActions() {
  const router = useRouter()
  return useMemo(() => {
    const run =
      <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
      async (...args: A) => {
        const result = await fn(...args)
        await router.invalidate()
        return result
      }
    return {
      addTransaction: run((input: Omit<Transaction, 'id'>) => createTransaction({ data: input })),
      removeTransaction: run((id: string) => deleteTransaction({ data: { id } })),
      addAccount: run((input: Omit<Account, 'id'>) => createAccount({ data: input })),
      removeAccount: run((id: string) => deleteAccount({ data: { id } })),
      addDebt: run((input: Omit<Debt, 'id'>) => createDebt({ data: input })),
      removeDebt: run((id: string) => deleteDebt({ data: { id } })),
      loadSample: run(() => loadSampleLedger()),
    }
  }, [router])
}
