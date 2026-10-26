// In-memory cache for demo API responses (cleared on reload). Never used for uploaded or Nightscout data.
// It stores the request itself, so a background prefetch and a screen asking for the same data
// share one request. A caller's signal only stops that caller waiting; the shared request carries on
// and its result is kept for next time. Failed requests are dropped so they can be retried.
import { ApiError, api } from '../api.js'

const store = new Map()

function waitFor(promise, signal) {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(new ApiError('Request cancelled.', { kind: 'aborted' }))
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new ApiError('Request cancelled.', { kind: 'aborted' }))
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (data) => {
        signal.removeEventListener('abort', onAbort)
        resolve(data)
      },
      (error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

function cached(key, fetcher, signal) {
  let entry = store.get(key)
  if (!entry) {
    entry = fetcher().catch((error) => {
      store.delete(key)
      throw error
    })
    store.set(key, entry)
  }
  return waitFor(entry, signal)
}

export const demoApi = {
  patients: (signal) => cached('patients', () => api.patients(), signal),
  timeline: (id, signal) => cached(`timeline:${id}`, () => api.timeline(id), signal),
  explain: (id, i, signal) => cached(`explain:${id}:${i}`, () => api.explain(id, i), signal),
  patterns: (id, signal) => cached(`patterns:${id}`, () => api.patterns(id), signal),
  report: (id, signal) => cached(`report:${id}`, () => api.report(id), signal),
  performance: (signal) => cached('performance', () => api.performance(), signal),
}

/** Display name for a demo patient: position in API order. */
export function demoPatientName(patients, id) {
  const i = patients?.findIndex((p) => p.id === id) ?? -1
  return i >= 0 ? `Demo patient ${i + 1}` : null
}
