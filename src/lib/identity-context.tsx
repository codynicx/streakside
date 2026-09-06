import {
  getUser,
  logout as netlifyLogout,
  onAuthChange,
  type User,
} from '@netlify/identity'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface IdentityContextValue {
  user: User | null
  ready: boolean
  logout: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getUser().then((currentUser) => {
      setUser(currentUser ?? null)
      setReady(true)
    })

    return onAuthChange((_event, currentUser) => {
      setUser(currentUser ?? null)
      setReady(true)
    })
  }, [])

  return (
    <IdentityContext.Provider
      value={{ user, ready, logout: netlifyLogout }}
    >
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const context = useContext(IdentityContext)
  if (!context) {
    throw new Error('useIdentity must be used within IdentityProvider')
  }
  return context
}
