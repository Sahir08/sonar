import { useMemo, useState } from 'react'
import { SessionContext } from './session.js'

/**
 * upload: { analysis, fileName } | null
 * nightscout: { analysis, url, token, fetchedAt } | null
 * Held in React state only; gone on reload.
 */
export default function SessionProvider({ children }) {
  const [upload, setUpload] = useState(null)
  const [nightscout, setNightscout] = useState(null)

  const value = useMemo(
    () => ({
      upload,
      setUpload,
      clearUpload: () => setUpload(null),
      nightscout,
      setNightscout,
      clearNightscout: () => setNightscout(null),
    }),
    [upload, nightscout],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
