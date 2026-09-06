import { getUser, type User } from '@netlify/identity'
import { createMiddleware } from '@tanstack/react-start'

export const identityMiddleware = createMiddleware().server(
  async ({ next }) => {
    const user: User | null = (await getUser()) ?? null
    return next({ context: { user } })
  },
)

export const requireAuthMiddleware = createMiddleware().server(
  async ({ next }) => {
    const user = await getUser()
    if (!user) throw new Error('Sign in to continue')
    return next({ context: { user } })
  },
)
