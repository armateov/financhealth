import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard,
  ReceiptText,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react'
import { Logo } from './Logo'
import { profile } from '@/lib/fixtures'

const nav = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/app/transactions', label: 'Transactions', icon: ReceiptText, exact: false },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')

  const sidebar = (
    <div className="flex h-full flex-col gap-8 p-6">
      <Logo to="/app" />
      <nav className="flex flex-col gap-1">
        {nav.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft no-underline transition hover:bg-paper-deep hover:text-ink"
            activeProps={{ className: '!bg-ink !text-paper' }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <Link
        to="/app/transactions"
        search={{ add: true }}
        onClick={() => setOpen(false)}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-ink/25 px-3 py-2.5 text-sm font-semibold text-ink no-underline transition hover:border-ink hover:bg-card"
      >
        <Plus className="h-4 w-4" /> Record entry
      </Link>
      <div className="mt-auto flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-moss text-sm font-semibold text-paper">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{profile.name}</p>
          <p className="truncate text-xs text-ink-soft">{profile.email}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: '/login' })}
          className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-deep hover:text-clay"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="grain min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-paper lg:block">
        {sidebar}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo to="/app" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 hover:bg-paper-deep"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-paper shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-2 hover:bg-paper-deep"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="relative z-10 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  )
}
