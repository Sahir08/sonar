// Background loading so the first visit to each screen is instant.
// Runs only when the browser is idle, never on replay ticks, and never fetches explanations.
import { demoApi } from './cache.js'

/** Run fn when the browser is idle. Returns a cancel function. */
export function whenIdle(fn) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: 2000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 200) // Safari has no requestIdleCallback
  return () => clearTimeout(id)
}

/** Skip optional downloads when the user has asked to save data. */
export function saveData() {
  return navigator.connection?.saveData === true
}

const ignore = () => {}

/** Demo patient list (Home: the demo is the most likely next step). */
export function prefetchPatients() {
  demoApi.patients().catch(ignore)
}

/** A demo patient's Today, Patterns and Report data, into the in-memory cache. */
export function prefetchDemoPatient(id) {
  demoApi.timeline(id).catch(ignore)
  demoApi.patterns(id).catch(ignore)
  demoApi.report(id).catch(ignore)
}
