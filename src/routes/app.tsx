import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { getServerUser } from '@/lib/auth'
import { getLedger } from '@/server/ledger'

export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    const user = await getServerUser()
    if (!user) throw redirect({ to: '/login' })
    return { user }
  },
  loader: () => getLedger(),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
