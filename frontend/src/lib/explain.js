// Plain-language wording for EXPLANATION groups.
import { formatHour, formatInt, parseTime } from './format.js'
import { formatGlucoseWithUnit, trendText } from './units.js'

export const SMALL_EFFECT = 0.25

const ok = (v) => v !== null && v !== undefined && !Number.isNaN(v)

/** Value shown on a group card, e.g. "Falling 2.4 mg/dL per min", "93 mg/dL", "8 PM". */
export function groupValue(group, explanation, units) {
  switch (group.group) {
    case 'Glucose trend':
      return trendText(explanation.snapshot?.trend_per_min, units) ?? 'Not available'
    case 'Glucose level':
      return formatGlucoseWithUnit(explanation.snapshot?.glucose, units)
    case 'Time of day':
      return formatHour(parseTime(explanation.time))
    case 'Glucose variability':
      return Math.abs(group.effect) < SMALL_EFFECT ? 'Very small effect' : 'Glucose has been swinging'
    default:
      return Math.abs(group.effect) < SMALL_EFFECT ? 'Very small effect' : ''
  }
}

/** Split groups into increasing / lowering cards and small factors; bars scale to the largest |effect|. */
export function organizeGroups(explanation) {
  const groups = (explanation?.groups ?? []).filter((g) => ok(g.effect))
  const maxEffect = Math.max(...groups.map((g) => Math.abs(g.effect)), 0)
  const scale = (g) => (maxEffect > 0 ? Math.abs(g.effect) / maxEffect : 0)
  const byEffect = (a, b) => Math.abs(b.effect) - Math.abs(a.effect)
  const big = groups.filter((g) => Math.abs(g.effect) >= SMALL_EFFECT).sort(byEffect)
  return {
    increasing: big.filter((g) => g.direction === 'increases').map((g) => ({ ...g, scale: scale(g) })),
    lowering: big.filter((g) => g.direction === 'lowers').map((g) => ({ ...g, scale: scale(g) })),
    small: groups.filter((g) => Math.abs(g.effect) < SMALL_EFFECT).sort(byEffect),
  }
}

/** Signed effect for detail rows: "+2.69" / "−0.48". */
export function formatEffect(effect) {
  if (!ok(effect)) return '—'
  const abs = Math.abs(effect).toFixed(2)
  return effect < 0 ? `−${abs}` : `+${abs}`
}

/** "What else was happening" tiles. */
export function contextItems(context) {
  const c = context ?? {}
  const na = 'Not available'
  return [
    { label: 'Steps, last hour', value: ok(c.steps_1h) ? formatInt(c.steps_1h) : na },
    { label: 'Carbs, last 3 h', value: ok(c.carbs_3h) ? `${formatInt(c.carbs_3h)} g` : na },
    { label: 'Insulin, last 3 h', value: ok(c.insulin_3h) ? `${Number(c.insulin_3h).toFixed(1)} u` : na },
    { label: 'Heart rate', value: ok(c.heart_rate) ? `${formatInt(c.heart_rate)} bpm` : na },
  ]
}
