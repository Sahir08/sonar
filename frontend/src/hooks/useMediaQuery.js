import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (callback) => {
      const mq = window.matchMedia?.(query)
      if (!mq) return () => {}
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  )
}

export const DESKTOP_QUERY = '(min-width: 900px)'
