import { createServerFn } from '@tanstack/react-start'
import { getUser } from '@netlify/identity'

/** The signed-in user read from the `nf_jwt` cookie, or null. */
export const getServerUser = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getUser()
  return user ? { id: user.id, email: user.email ?? '', name: user.name ?? '' } : null
})
