import { useSyncExternalStore } from 'react'
import type { Transaction } from './fixtures'
import { transactions as seed } from './fixtures'

// Client-side ledger seeded from fixtures. A later milestone replaces this
// with server functions backed by the database; the hook signatures stay.

let state: Transaction[] = seed
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTransactions() {
  return useSyncExternalStore(subscribe, () => state, () => seed)
}

export function addTransaction(input: Omit<Transaction, 'id'>) {
  const tx: Transaction = { ...input, id: `local-${Date.now()}` }
  state = [tx, ...state].sort((a, b) => b.date.localeCompare(a.date))
  emit()
  return tx
}

export function removeTransaction(id: string) {
  state = state.filter((t) => t.id !== id)
  emit()
}
