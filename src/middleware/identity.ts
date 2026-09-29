import { createMiddleware } from '@tanstack/react-start'
import { getUser } from '@netlify/identity'

/** Requires a signed-in Netlify Identity user and exposes it as `context.user`. */
export const requireAuthMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const user = await getUser()
  if (!user) throw new Error('Authentication required')
  return next({ context: { user } })
})
