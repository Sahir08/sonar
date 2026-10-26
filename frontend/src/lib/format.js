// Time and number formatting. API times are local wall-clock strings: "YYYY-MM-DDTHH:MM".

const TIME_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/

/** Parse an API time string as local time. Returns a Date or null. */
export function parseTime(value) {
  if (!value) return null
  const m = TIME_RE.exec(value)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Parse a date-only string "YYYY-MM-DD" as a local date (not UTC). */
export function parseDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '')
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}

const clockFmt =new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const dateLongFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const dateYearFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const intFmt = new Intl.NumberFormat('en-US')

/** "8:00 PM" */
export function formatClock(date) {
  return date ? clockFmt.format(date) : '—'
}

/** "8 PM" for an hour 0-23 */
export function hourLabel(hour) {
  const h = ((hour % 24) + 24) % 24
  const suffix = h < 12 ? 'AM' : 'PM'
  const twelve = h % 12 === 0 ? 12 : h % 12
  return `${twelve} ${suffix}`
}

/** "8 PM" for a Date */
export function formatHour(date) {
  return date ? hourLabel(date.getHours()) : '—'
}

/** Morning (5 AM–noon), Afternoon (noon–5 PM), Tonight (5 PM–midnight), Overnight (midnight–5 AM) */
export function dayPart(date) {
  if (!date) return ''
  const h = date.getHours()
  if (h < 5) return 'Overnight'
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Tonight'
}

/** "Tonight · 8:00 PM" */
export function formatMoment(date) {
  return date ? `${dayPart(date)} · ${formatClock(date)}` : ''
}

/** "Jun 13" */
export function formatDate(date) {
  return date ? dateFmt.format(date) : '—'
}

/** "Wed, Jun 13" */
export function formatDateLong(date) {
  return date ? dateLongFmt.format(date) : '—'
}

/** "Jun 13, 2018" */
export function formatDateYear(date) {
  return date ? dateYearFmt.format(date) : '—'
}

/** "2 h 05 min", "45 min" */
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '—'
  const m = Math.max(0, Math.round(minutes))
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (!h) return `${rest} min`
  return `${h} h ${String(rest).padStart(2, '0')} min`
}

/** "1,895" */
export function formatInt(value) {
  return value === null || value === undefined || Number.isNaN(value) ? '—' : intFmt.format(Math.round(value))
}

/** "64%" */
export function formatPercent(value, digits = 0) {
  return value === null || value === undefined || Number.isNaN(value) ? '—' : `${Number(value).toFixed(digits)}%`
}
