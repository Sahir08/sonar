import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSession } from '../../context/session.js'
import { useApi } from '../../hooks/useApi.js'
import { demoApi } from '../../lib/cache.js'
import { formatClock } from '../../lib/format.js'
import {
  NIGHTSCOUT_SOURCE,
  UPLOAD_SOURCE,
  demoSource,
  sameSource,
  sourceFromPath,
  sourceLinks,
  tabFromPath,
} from '../../lib/sources.js'
import { replayStartIndex } from '../../lib/timeline.js'
import BottomSheet from '../ui/BottomSheet.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'
import { InlineError } from '../ui/StateMessage.jsx'
import './SourceSwitcher.css'

const TAB_NAME = { today: 'Today', patterns: 'Patterns', report: 'Report' }
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

/** Short pill label for the source on screen; the same on all three tabs. */
function pillLabel(source, name) {
  if (source?.kind === 'upload') return 'Your upload'
  if (source?.kind === 'nightscout') return 'Nightscout'
  return name
}

/**
 * Compact pill ("Demo patient 2 ▾") that opens a sheet to switch to another demo patient,
 * uploaded data or Nightscout, staying on the same tab. Also leads to the overview, Upload and Connect.
 * name: the demo patient's display name (not needed for upload or Nightscout).
 * replayIndex: the current demo replay moment, kept when switching between demo patients on Today.
 */
export default function SourceSwitcher({ name = null, replayIndex = null }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const current = sourceFromPath(pathname)
  const tab = tabFromPath(pathname) ?? 'today'
  const label = pillLabel(current, name)
  if (!label) return null

  return (
    <>
      <button
        type="button"
        className="source-pill"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="visually-hidden">Data: </span>
        <span className="source-pill__label">{label}</span>
        <Icon name="chevronDown" size={16} strokeWidth={2.4} className="source-pill__chevron" />
        <span className="visually-hidden">. Switch data</span>
      </button>
      <SourceSheet
        open={open}
        onClose={() => setOpen(false)}
        current={current}
        tab={tab}
        replayIndex={replayIndex}
      />
    </>
  )
}

/**
 * The source list in a sheet.
 * With a current source it switches data ("Switch data", stays on the same tab).
 * Without one (a tab tapped before any data is open) it asks first, then opens `tab` for the picked source.
 * Upload a CSV / Connect Nightscout pass the tab along, so those screens open it after success.
 */
export function SourceSheet({ open, onClose, current = null, tab, replayIndex = null }) {
  const choosing = !current
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={choosing ? 'Choose a patient or your data' : 'Switch data'}
      subtitle={choosing ? `${TAB_NAME[tab]} opens after you choose.` : `You'll stay on ${TAB_NAME[tab]}.`}
    >
      <SourceList current={current} tab={tab} replayIndex={replayIndex} onClose={onClose} />
    </BottomSheet>
  )
}

function SourceList({ current, tab, replayIndex, onClose }) {
  const choosing = !current
  const nextTab = choosing ? { nextTab: tab } : undefined
  const session = useSession()
  const patients = useApi(demoApi.patients, 'patients')

  // On Today, moving between demo patients keeps the same time since each one's replay start
  // (the same "moment" the overview uses)
  const pathFor = (source) => {
    const path = sourceLinks(source)[tab]
    if (tab !== 'today' || source.kind !== 'demo' || current?.kind !== 'demo' || replayIndex === null) return path
    const from = patients.data?.find((p) => p.id === current.id)
    const to = patients.data?.find((p) => p.id === source.id)
    if (!from || !to) return path
    const offset = replayIndex - replayStartIndex(from.first_alert)
    return `${path}?i=${Math.max(0, replayStartIndex(to.first_alert) + offset)}`
  }

  const row = (source, props) => (
    <li key={source.id ?? source.kind}>
      <SourceRow to={pathFor(source)} current={sameSource(source, current)} onClose={onClose} {...props} />
    </li>
  )

  let demos
  if (patients.error) {
    demos = (
      <div className="source-group__error">
        <InlineError error={patients.error} />
        <Button variant="secondary" size="sm" icon="refresh" onClick={patients.retry}>
          Retry
        </Button>
      </div>
    )
  } else if (!patients.data) {
    demos = (
      <LoadingRegion label="Loading demo patients" className="source-list">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={62} radius={18} />
        ))}
      </LoadingRegion>
    )
  } else {
    demos = (
      <ul className="source-list">
        {patients.data.map((p, k) =>
          row(demoSource(p.id), {
            icon: 'user',
            name: `Demo patient ${k + 1}`,
            meta: `${p.days ?? '—'} days of data · ${p.lows === null || p.lows === undefined ? '— lows' : plural(p.lows, 'low')}`,
          }),
        )}
        {/* The overview isn't a single source, so it's left out when choosing one for a tab */}
        {!choosing && (
          <li>
            <SourceRow
              to="/demo/overview"
              action
              onClose={onClose}
              icon="overview"
              name="Overview"
              meta={`All ${patients.data.length} patients on one replay clock`}
            />
          </li>
        )}
      </ul>
    )
  }

  const upload = session.upload?.analysis ? session.upload : null
  const nightscout = session.nightscout?.analysis ? session.nightscout : null

  return (
    <div className="source-groups">
      <section className="source-group" aria-labelledby="source-own-heading">
        <h3 id="source-own-heading" className="section-label source-group__heading">
          Your data
        </h3>
        <ul className="source-list">
          {upload ? (
            row(UPLOAD_SOURCE, { icon: 'upload', name: 'Your uploaded data', meta: upload.fileName || 'Uploaded file' })
          ) : (
            <li>
              <SourceRow
                to="/upload"
                state={nextTab}
                action
                onClose={onClose}
                icon="upload"
                name="Upload a CSV"
                meta="LibreView or Dexcom Clarity export"
              />
            </li>
          )}
          {nightscout ? (
            row(NIGHTSCOUT_SOURCE, {
              icon: 'link',
              name: 'Live from Nightscout',
              meta: nightscout.fetchedAt ? `Last updated ${formatClock(new Date(nightscout.fetchedAt))}` : 'Connected',
            })
          ) : (
            <li>
              <SourceRow
                to="/nightscout"
                state={nextTab}
                action
                onClose={onClose}
                icon="link"
                name="Connect Nightscout"
                meta="See live readings from your site"
              />
            </li>
          )}
        </ul>
      </section>
      <section className="source-group" aria-labelledby="source-demo-heading">
        <h3 id="source-demo-heading" className="section-label source-group__heading">
          Demo patients
        </h3>
        {demos}
      </section>
    </div>
  )
}

function SourceRow({ to, state, current = false, action = false, onClose, icon, name, meta }) {
  return (
    <Link
      to={to}
      state={state}
      className={`source-row ${action ? 'source-row--action' : ''}`}
      aria-current={current ? 'true' : undefined}
      onClick={(e) => {
        if (current) e.preventDefault()
        onClose()
      }}
    >
      <span className="source-row__icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="source-row__text">
        <span className="source-row__name">{name}</span>
        <span className="source-row__meta">{meta}</span>
      </span>
      {current ? (
        <span className="source-row__end source-row__end--current">
          <Icon name="check" size={20} />
          <span className="visually-hidden">(showing now)</span>
        </span>
      ) : (
        <Icon name="chevronRight" size={20} className="source-row__end" />
      )}
    </Link>
  )
}
