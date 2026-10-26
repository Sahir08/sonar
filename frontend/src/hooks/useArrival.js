import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const KEYS = ['i', 'day', 'from']

/**
 * One-time dashboard instructions from the URL: ?i= (replay index), ?day= (YYYY-MM-DD), ?from= (e.g. "overview").
 * Read once when the screen opens, then removed from the address bar so the remembered
 * replay position takes over afterwards.
 */
export function useArrival() {
  const [search, setSearch] = useSearchParams()
  const [arrival] = useState(() => {
    const i = Number.parseInt(search.get('i') ?? '', 10)
    return {
      index: Number.isFinite(i) ? i : null,
      day: /^\d{4}-\d{2}-\d{2}$/.test(search.get('day') ?? '') ? search.get('day') : null,
      from: search.get('from'),
    }
  })

  useEffect(() => {
    if (KEYS.some((k) => search.has(k))) {
      const next = new URLSearchParams(search)
      KEYS.forEach((k) => next.delete(k))
      setSearch(next, { replace: true })
    }
  }, [search, setSearch])

  return arrival
}
