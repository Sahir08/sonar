import { createContext, useContext } from 'react'

// Uploaded and Nightscout results live here, in memory only.
// Never write any of this to localStorage or sessionStorage.
export const SessionContext = createContext(null)

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
