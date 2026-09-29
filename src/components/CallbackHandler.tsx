import { useEffect } from 'react'
import { handleAuthCallback } from '@netlify/identity'

const AUTH_HASH_PATTERN = /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/

export const INVITE_TOKEN_KEY = 'ledgerwise:invite-token'

/**
 * Finishes Netlify Identity links (email confirmation, password recovery,
 * invites) that land on any page with a token in the URL hash.
 */
export function CallbackHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!AUTH_HASH_PATTERN.test(window.location.hash)) return
    handleAuthCallback()
      .then((result) => {
        if (!result) return
        if (result.type === 'recovery') {
          window.location.href = '/login?mode=reset'
        } else if (result.type === 'invite' && result.token) {
          sessionStorage.setItem(INVITE_TOKEN_KEY, result.token)
          window.location.href = '/login?mode=invite'
        } else {
          window.location.href = '/app'
        }
      })
      .catch(() => {
        window.location.href = '/login?mode=signin&expired=1'
      })
  }, [])

  return <>{children}</>
}
