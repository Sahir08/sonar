// Glucose range categories for Patterns and the Report.
// Below-range uses the low color (it is the same < 70 condition as "Low now"), in range uses calm
// (same as the chart's target band), and above-range uses neutral grays: amber is reserved for Watch.
import { MMOL, unitLabel } from './units.js'

const LOW_SOFT = 'color-mix(in srgb, var(--low-now) 55%, var(--surface))'
const HIGH_SOFT = 'color-mix(in srgb, var(--text-3) 50%, var(--surface))'

/** Three ranges from PATTERNS: time_below / time_in_range / time_above. */
export function threeRanges(patterns, units) {
  const u = unitLabel(units)
  const mm = units === MMOL
  return [
    { key: 'below', label: 'Below range', sub: `${mm ? '<3.9' : '<70'} ${u}`, value: patterns.time_below, color: 'var(--low-now)' },
    { key: 'in', label: 'In range', sub: `${mm ? '3.9–10.0' : '70–180'} ${u}`, value: patterns.time_in_range, color: 'var(--calm)' },
    { key: 'above', label: 'Above range', sub: `${mm ? '>10.0' : '>180'} ${u}`, value: patterns.time_above, color: HIGH_SOFT },
  ]
}

/** Five ranges from REPORT.ranges. */
export function fiveRanges(ranges, units) {
  const u = unitLabel(units)
  const mm = units === MMOL
  return [
    { key: 'very_low', label: 'Very low', sub: `${mm ? '<3.0' : '<54'} ${u}`, value: ranges.very_low, color: 'var(--low-now)' },
    { key: 'low', label: 'Low', sub: `${mm ? '3.0–3.8' : '54–69'} ${u}`, value: ranges.low, color: LOW_SOFT },
    { key: 'in_range', label: 'In range', sub: `${mm ? '3.9–10.0' : '70–180'} ${u}`, value: ranges.in_range, color: 'var(--calm)' },
    { key: 'high', label: 'High', sub: `${mm ? '10.1–13.9' : '181–250'} ${u}`, value: ranges.high, color: HIGH_SOFT },
    { key: 'very_high', label: 'Very high', sub: `${mm ? '>13.9' : '>250'} ${u}`, value: ranges.very_high, color: 'var(--text-2)' },
  ]
}

const PERIOD_ORDER = ['Overnight', 'Morning', 'Afternoon', 'Evening']

/** lows_by_period in day order: [{ name: "Overnight", hours: "12–6 AM", count }] */
export function periodsInOrder(lowsByPeriod) {
  return Object.entries(lowsByPeriod ?? {})
    .map(([key, count]) => {
      const m = /^(.*?)\s*\((.*)\)$/.exec(key)
      return { key, name: m ? m[1] : key, hours: m ? m[2] : '', count }
    })
    .sort((a, b) => {
      const ia = PERIOD_ORDER.indexOf(a.name)
      const ib = PERIOD_ORDER.indexOf(b.name)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
}
