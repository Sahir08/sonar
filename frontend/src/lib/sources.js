// Which data source (demo patient, upload, Nightscout) a route belongs to, for navigation.

export function demoSource(id) {
  const base = `/demo/${encodeURIComponent(id)}`
  return { kind: 'demo', id, today: base, base }
}

export const UPLOAD_SOURCE = { kind: 'upload', id: null, today: '/upload/dashboard', base: '/upload' }
export const NIGHTSCOUT_SOURCE = { kind: 'nightscout', id: null, today: '/nightscout/live', base: '/nightscout' }

function decode(segment) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export function sourceFromPath(pathname) {
  const demo = /^\/demo\/([^/]+)(?:\/(?:patterns|report))?\/?$/.exec(pathname)
  if (demo && demo[1] !== 'overview') return demoSource(decode(demo[1]))
  if (/^\/upload\/(?:dashboard|patterns|report)\/?$/.test(pathname)) return UPLOAD_SOURCE
  if (/^\/nightscout\/(?:live|patterns|report)\/?$/.test(pathname)) return NIGHTSCOUT_SOURCE
  return null
}

/** Which tab a source route shows: "today", "patterns", "report", or null. */
export function tabFromPath(pathname) {
  if (!sourceFromPath(pathname)) return null
  if (/\/patterns\/?$/.test(pathname)) return 'patterns'
  if (/\/report\/?$/.test(pathname)) return 'report'
  return 'today'
}

export function sameSource(a, b) {
  if (!a || !b) return a === b
  return a.kind === b.kind && a.id === b.id
}

/** Today, Patterns, Report links for a source. */
export function sourceLinks(source) {
  if (!source) return null
  return {
    today: source.today,
    patterns: `${source.base}/patterns`,
    report: `${source.base}/report`,
  }
}

/** The tabs that belong to a data source, in tab bar order. */
export const SOURCE_TABS = [
  { tab: 'today', label: 'Today', icon: 'today', end: true },
  { tab: 'patterns', label: 'Patterns', icon: 'patterns' },
  { tab: 'report', label: 'Report', icon: 'report' },
]
