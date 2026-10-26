// Every request to the Sonar backend goes through this module.
import { API_URL, UNREACHABLE_TEXT } from './constants.js'

// The hosted server sleeps when idle and can take about a minute to wake, so requests wait long
// enough for a cold start before showing "Can't reach the Sonar server."
const TIMEOUT_MS = 90000
const LONG_TIMEOUT_MS = 180000 // upload and Nightscout: cold start plus analysis
const WAKE_NOTE_MS = 5000

// ---------- Cold-start tracking ----------
// If the server hasn't answered recently (it sleeps after ~15 idle minutes), a request taking longer
// than 5 seconds means it's probably waking up. Screens show a "Waking up the server…" note meanwhile.
const MAY_BE_ASLEEP_MS = 10 * 60 * 1000
let lastAnswerAt = 0
let waitingForServer = 0 // requests sent while the server may be asleep
let waking = false
const serverAwake = () => Date.now() - lastAnswerAt < MAY_BE_ASLEEP_MS
const wakeListeners = new Set()

function setWaking(value) {
  if (waking === value) return
  waking = value
  wakeListeners.forEach((listener) => listener())
}

export function subscribeServerWaking(listener) {
  wakeListeners.add(listener)
  return () => wakeListeners.delete(listener)
}

export function isServerWaking() {
  return waking
}

/** Wake the server early (app load, or returning to the app) if it may have gone to sleep. */
export function wakeServer() {
  if (!serverAwake()) api.health().catch(() => {})
}

export class ApiError extends Error {
  // kind: "network" (server unreachable) | "server" (error response) | "aborted"
  constructor(message, { kind, status = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

/** Message to show the user for any failed request. */
export function errorMessage(error) {
  if (!error) return ''
  if (error.kind === 'network') return UNREACHABLE_TEXT
  return error.message || 'Something went wrong.'
}

async function request(path, { method = 'GET', json, formData, signal, timeout = TIMEOUT_MS } = {}) {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }
  // A timeout is treated the same as an unreachable server
  const timer = setTimeout(() => controller.abort(), timeout)
  const beforeAwake = !serverAwake()
  if (beforeAwake) waitingForServer++
  const wakeTimer = beforeAwake ? setTimeout(() => setWaking(!serverAwake()), WAKE_NOTE_MS) : null

  const init = { method, signal: controller.signal, headers: {} }
  if (json !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(json)
  } else if (formData) {
    init.body = formData
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, init)
    lastAnswerAt = Date.now() // any answer, even an error status, means the server is up
  } catch {
    if (signal?.aborted) throw new ApiError('Request cancelled.', { kind: 'aborted' })
    throw new ApiError(UNREACHABLE_TEXT, { kind: 'network' })
  } finally {
    clearTimeout(timer)
    clearTimeout(wakeTimer)
    signal?.removeEventListener('abort', onAbort)
    // Hide the note once the server answers, or when no request is still waiting for it
    if (beforeAwake) waitingForServer--
    if (serverAwake() || waitingForServer === 0) setWaking(false)
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = (body && typeof body.error === 'string' && body.error) || `The server returned an error (${response.status}).`
    throw new ApiError(message, { kind: 'server', status: response.status })
  }
  if (body === null) {
    throw new ApiError('The server sent a response Sonar could not read.', { kind: 'server', status: response.status })
  }
  return body
}

const enc = encodeURIComponent

export const api = {
  health: (signal) => request('/api/health', { signal }),
  patients: (signal) => request('/api/patients', { signal }),
  timeline: (id, signal) => request(`/api/patients/${enc(id)}`, { signal }),
  explain: (id, index, signal) => request(`/api/patients/${enc(id)}/explain/${enc(index)}`, { signal }),
  patterns: (id, signal) => request(`/api/patients/${enc(id)}/patterns`, { signal }),
  report: (id, signal) => request(`/api/patients/${enc(id)}/report`, { signal }),
  performance: (signal) => request('/api/performance', { signal }),

  upload(file, signal) {
    const formData = new FormData()
    formData.append('file', file)
    return request('/api/upload', { method: 'POST', formData, signal, timeout: LONG_TIMEOUT_MS })
  },

  nightscout({ url, token }, signal) {
    const json = { url, days: 3, utc_offset_min: -new Date().getTimezoneOffset() }
    if (token) json.token = token
    return request('/api/nightscout', { method: 'POST', json, signal, timeout: LONG_TIMEOUT_MS })
  },
}
