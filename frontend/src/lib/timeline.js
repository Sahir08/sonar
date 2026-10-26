// Calculations on a TIMELINE that only look at data up to a given index (never ahead).
import {
  HIGH,
  HORIZON_READINGS,
  LOW,
  READINGS_PER_HOUR,
  READING_MINUTES,
  REPLAY_LEAD_READINGS,
} from '../constants.js'

const ok = (v) => v !== null && v !== undefined && !Number.isNaN(v)

/** True when an optional array exists and holds at least one real value. */
export function hasValues(arr) {
  return Array.isArray(arr) && arr.some(ok)
}

/** Replay start for uploads: 2 hours before the first alert start in the explanations map, or 0. */
export function uploadStartIndex(explanations) {
  const starts = Object.keys(explanations ?? {})
    .map(Number)
    .filter(Number.isFinite)
  return starts.length ? Math.max(0, Math.min(...starts) - REPLAY_LEAD_READINGS) : 0
}

/** Alert start = alert[i] is true and alert[i-1] is not. */
export function isAlertStart(alert, i) {
  return alert?.[i] === true && alert?.[i - 1] !== true
}

/** All alert start indices up to and including `upTo`. */
export function alertStartsUpTo(alert, upTo) {
  const out = []
  if (!alert) return out
  const end = Math.min(upTo, alert.length - 1)
  for (let i = 0; i <= end; i++) if (isAlertStart(alert, i)) out.push(i)
  return out
}

/** If an alert is active at i, the index where it started; otherwise null. */
export function activeAlertStart(alert, i) {
  if (alert?.[i] !== true) return null
  let s = i
  while (s > 0 && alert[s - 1] === true) s--
  return s
}

/** Same formula as the model's 15-minute trend: (g[i] - g[i-3]) / 15, in mg/dL per min. */
export function trendPerMin(glucose, i) {
  const steps = 15 / READING_MINUTES
  if (i < steps) return null
  const now = glucose?.[i]
  const before = glucose?.[i - steps]
  return ok(now) && ok(before) ? (now - before) / 15 : null
}

/** Glucose change over the last hour, in mg/dL. */
export function hourChange(glucose, i) {
  if (i < READINGS_PER_HOUR) return null
  const now = glucose?.[i]
  const before = glucose?.[i - READINGS_PER_HOUR]
  return ok(now) && ok(before) ? now - before : null
}

/** Index of the first reading on the same calendar day as reading i. */
export function dayStartIndex(time, i) {
  const day = time?.[i]?.slice(0, 10)
  if (!day) return i
  let s = i
  while (s > 0 && time[s - 1]?.slice(0, 10) === day) s--
  return s
}

/** A low onset: glucose drops below 70 from a reading at or above 70. */
export function isLowOnset(glucose, i) {
  const now = glucose?.[i]
  const before = glucose?.[i - 1]
  return ok(now) && ok(before) && now < LOW && before >= LOW
}

/** "Today" = from midnight of the replay day up to index i. */
export function todaySummary(timeline, i) {
  const { time, glucose, alert } = timeline
  const start = dayStartIndex(time, i)
  let valid = 0
  let inRange = 0
  let lows = 0
  let alerts = 0
  for (let j = start; j <= i; j++) {
    const g = glucose?.[j]
    if (ok(g)) {
      valid++
      if (g >= LOW && g <= HIGH) inRange++
    }
    if (isLowOnset(glucose, j)) lows++
    if (isAlertStart(alert, j)) alerts++
  }
  return {
    timeInRange: valid ? (inRange / valid) * 100 : null,
    lows,
    alerts,
  }
}

/**
 * Outcome of the alert that started at s, judged only from data replayed so far (up to index):
 * "low" if glucose < 70 within the next 12 readings, "none" once 12 readings passed without one, else "pending".
 */
export function alertOutcome(glucose, s, index) {
  const end = Math.min(s + HORIZON_READINGS, index)
  for (let j = s + 1; j <= end; j++) {
    const g = glucose?.[j]
    if (ok(g) && g < LOW) return 'low'
  }
  return index >= s + HORIZON_READINGS ? 'none' : 'pending'
}

/** First reading on a calendar day ("YYYY-MM-DD"), or null if the day isn't in the data. */
export function firstIndexOfDay(time, day) {
  if (!day || !time) return null
  const i = time.findIndex((t) => t?.slice(0, 10) === day)
  return i >= 0 ? i : null
}

/** Replay starts 2 hours before the first alert. */
export function replayStartIndex(firstAlert) {
  return ok(firstAlert) ? Math.max(0, firstAlert - REPLAY_LEAD_READINGS) : 0
}
