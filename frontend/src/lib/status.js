// The one shared status function. latest.status from the API uses the same keys.
import { LOW } from '../constants.js'

// color: fills (dots, bars, bands). text: the same hue tuned for 4.5:1 text contrast.
export const STATUS = {
  no_data: { label: 'No data', color: 'var(--text-2)', text: 'var(--text-2)', glow: 'none' },
  low_now: { label: 'Low now', color: 'var(--low-now)', text: 'var(--low-now-text)', glow: 'var(--glow-low-now)' },
  not_enough_data: { label: 'Not enough data yet', color: 'var(--text-2)', text: 'var(--text-2)', glow: 'none' },
  high: { label: 'High risk', color: 'var(--high)', text: 'var(--high-text)', glow: 'var(--glow-high)' },
  watch: { label: 'Watch', color: 'var(--watch)', text: 'var(--watch-text)', glow: 'var(--glow-watch)' },
  low_risk: { label: 'Low risk', color: 'var(--calm)', text: 'var(--calm-text)', glow: 'var(--glow-calm)' },
}

export const STATUS_KEYS = Object.keys(STATUS)

const isMissing = (v) => v === null || v === undefined || Number.isNaN(v)

/**
 * g: glucose (mg/dL), r: risk (0-1), a: alert flag, t: threshold from TIMELINE.threshold
 */
export function getStatus(g, r, a, t) {
  if (isMissing(g)) return 'no_data'
  if (g < LOW) return 'low_now'
  if (isMissing(r)) return 'not_enough_data'
  if (a === true) return 'high'
  if (!isMissing(t) && r >= t / 2) return 'watch'
  return 'low_risk'
}

/** Risk as a whole percent, or null. Never shown for low_now. */
export function riskPercent(r) {
  return isMissing(r) ? null : Math.round(r * 100)
}

/** Whether a risk % should be shown for this status. */
export function showsRisk(status) {
  return status === 'high' || status === 'watch' || status === 'low_risk'
}

export function statusInfo(status) {
  return STATUS[status] ?? STATUS.no_data
}
