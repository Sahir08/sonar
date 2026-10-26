import { useCallback, useEffect, useEffectEvent, useState } from 'react'

/**
 * Load data from the API.
 * fetcher(signal) returns a promise. key identifies the request; pass null to skip.
 * Returns { data, error, loading, retry }.
 */
export function useApi(fetcher, key) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ requestKey: null, data: undefined, error: null })
  const requestKey = key === null || key === undefined ? null : `${key}#${attempt}`

  const run = useEffectEvent((signal) => fetcher(signal))

  useEffect(() => {
    if (requestKey === null) return undefined
    const controller = new AbortController()
    run(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ requestKey, data, error: null })
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ requestKey, data: undefined, error })
      },
    )
    return () => controller.abort()
  }, [requestKey])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const current = result.requestKey === requestKey
  return {
    data: current ? result.data : undefined,
    error: current ? result.error : null,
    loading: requestKey !== null && !current,
    retry,
  }
}
