// Glucose unit conversion and formatting. All API values are mg/dL.
export const MGDL = 'mgdl'
export const MMOL = 'mmol'
const MMOL_FACTOR = 18
const STEADY_MGDL_PER_MIN = 0.5

const isMissing = (v) => v === null || v === undefined || Number.isNaN(v)

export function unitLabel(units) {
  return units === MMOL ? 'mmol/L' : 'mg/dL'
}

/** Numeric value in display units (for chart data and axes), or null. */
export function toUnits(mgdl, units) {
  if (isMissing(mgdl)) return null
  return units === MMOL ? mgdl / MMOL_FACTOR : mgdl
}

/** Glucose as display text: "93" or "5.2". */
export function formatGlucose(mgdl, units) {
  const v = toUnits(mgdl, units)
  if (v === null) return '—'
  return units === MMOL ? v.toFixed(1) : String(Math.round(v))
}

/** Glucose with unit: "93 mg/dL". */
export function formatGlucoseWithUnit(mgdl, units) {
  const text = formatGlucose(mgdl, units)
  return text === '—' ? 'Not available' : `${text} ${unitLabel(units)}`
}

/** Fixed chart y-axis domain. */
export function glucoseDomain(units) {
  return units === MMOL ? [2.2, 19.4] : [40, 350]
}

export function trendDirection(perMin) {
  if (isMissing(perMin)) return null
  if (Math.abs(perMin) < STEADY_MGDL_PER_MIN) return 'steady'
  return perMin < 0 ? 'falling' : 'rising'
}

/** "Falling 2.4 mg/dL per min", "Rising 0.13 mmol/L per min", or "Steady". */
export function trendText(perMin, units) {
  const dir = trendDirection(perMin)
  if (!dir) return null
  if (dir === 'steady') return 'Steady'
  const abs = Math.abs(perMin)
  const value = units === MMOL ? (abs / MMOL_FACTOR).toFixed(2) : abs.toFixed(1)
  return `${dir === 'falling' ? 'Falling' : 'Rising'} ${value} ${unitLabel(units)} per min`
}

/** A glucose change over a period, e.g. "Down 88 mg/dL". */
export function changeText(deltaMgdl, units) {
  if (isMissing(deltaMgdl)) return null
  const abs = Math.abs(deltaMgdl)
  const value = units === MMOL ? (abs / MMOL_FACTOR).toFixed(1) : String(Math.round(abs))
  if (Number(value) === 0) return 'No change'
  return `${deltaMgdl < 0 ? 'Down' : 'Up'} ${value} ${unitLabel(units)}`
}
