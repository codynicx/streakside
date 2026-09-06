import { handleAuthCallback } from '@netlify/identity'
import { useEffect, type ReactNode } from 'react'

const authHashPattern =
  /^#(confirmation_token|recovery_token|invite_token|email_change_token|access_token)=/

export function CallbackHandler({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (authHashPattern.test(window.location.hash)) {
      handleAuthCallback().catch(() => undefined)
    }
  }, [])

  return children
}
