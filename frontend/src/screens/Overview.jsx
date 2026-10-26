import { Link } from 'react-router-dom'
import RiskHorizon from '../components/dashboard/RiskHorizon.jsx'
import ReplayControls from '../components/dashboard/ReplayControls.jsx'
import AnimatedNumber from '../components/ui/AnimatedNumber.jsx'
import Icon from '../components/ui/Icon.jsx'
import { Disclaimer } from '../components/ui/Notices.jsx'
import Page from '../components/ui/Page.jsx'
import Skeleton, { LoadingRegion } from '../components/ui/Skeleton.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { EmptyState, ErrorState } from '../components/ui/StateMessage.jsx'
import { READING_MINUTES } from '../constants.js'
import { useSettings } from '../context/settings.js'
import { useApi } from '../hooks/useApi.js'
import { useReplay } from '../hooks/useReplay.js'
import { demoApi } from '../lib/cache.js'
import { formatDuration, formatMoment, parseTime } from '../lib/format.js'
import { getStatus, riskPercent, showsRisk, statusInfo } from '../lib/status.js'
import { replayStartIndex, trendPerMin } from '../lib/timeline.js'
import { MMOL, formatGlucoseWithUnit, toUnits, trendDirection, unitLabel } from '../lib/units.js'
import './Overview.css'

const BACK = { to: '/demo', label: 'Patients' }
const TREND_ICON = { falling: 'arrowDown', rising: 'arrowUp', steady: 'arrowRight' }

async function loadAll(signal) {
  const patients = await demoApi.patients(signal)
  const timelines = await Promise.all(patients.map((p) => demoApi.timeline(p.id, signal)))
  return { patients, timelines }
}

export default function Overview() {
  const { data, error, loading, retry } = useApi(loadAll, 'overview')

  if (error) {
    return (
      <Page title="Overview" back={BACK}>
        <ErrorState error={error} onRetry={retry} />
      </Page>
    )
  }
  if (loading) {
    return (
      <Page title="Overview" back={BACK}>
        <LoadingRegion label="Loading patients" className="overview__grid">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="overview-card">
              <Skeleton width="50%" height={16} />
              <Skeleton width="40%" height={32} style={{ marginTop: 12 }} />
              <Skeleton height={14} radius={999} style={{ marginTop: 16 }} />
            </div>
          ))}
        </LoadingRegion>
      </Page>
    )
  }
  if (!data?.patients.length) {
    return (
      <Page title="Overview" back={BACK}>
        <EmptyState title="No demo patients are available." />
      </Page>
    )
  }
  return <OverviewReplay patients={data.patients} timelines={data.timelines} />
}

function OverviewReplay({ patients, timelines }) {
  // Each patient starts at its own start index; one shared offset advances them together
  const starts = patients.map((p) => replayStartIndex(p.first_alert))
  const maxOffset = Math.max(0, ...timelines.map((t, k) => t.time.length - 1 - starts[k]))
  // Remembered in memory, so coming back from a patient keeps the shared clock
  const replay = useReplay(maxOffset + 1, 0, { memoryKey: 'overview' })
  const offset = replay.index

  return (
    <Page title="Overview" back={BACK}>
      <p className="overview__intro">
        All demo patients on one replay clock. Each starts 2 hours before their first alert. Tap a patient to open
        their dashboard at the same moment.
      </p>
      <ReplayControls replay={replay} timeLabel={`${formatDuration(offset * READING_MINUTES)} into replay`} />
      <ul className="overview__grid">
        {patients.map((p, k) => (
          <li key={p.id}>
            <PatientCard
              id={p.id}
              name={`Demo patient ${k + 1}`}
              timeline={timelines[k]}
              index={Math.min(starts[k] + offset, timelines[k].time.length - 1)}
            />
          </li>
        ))}
      </ul>
      <Disclaimer />
    </Page>
  )
}

function PatientCard({ id, name, timeline, index }) {
  const { units } = useSettings()
  const glucose = timeline.glucose?.[index] ?? null
  const risk = timeline.risk?.[index] ?? null
  const status = getStatus(glucose, risk, timeline.alert?.[index], timeline.threshold)
  const info = statusInfo(status)
  const dir = trendDirection(trendPerMin(timeline.glucose, index))
  const pct = showsRisk(status) ? riskPercent(risk) : null
  const moment = formatMoment(parseTime(timeline.time[index]))

  const label = [
    `${name}: ${info.label}`,
    glucose !== null ? `glucose ${formatGlucoseWithUnit(glucose, units)}${dir ? `, ${dir}` : ''}` : 'no glucose reading',
    pct !== null ? `${pct}% chance of a low in the next hour` : null,
    'Open dashboard',
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <Link
      to={`/demo/${encodeURIComponent(id)}?i=${index}&from=overview`}
      className={`overview-card ${status === 'high' ? 'is-high' : ''}`}
      aria-label={label}
    >
      <span className="overview-card__top">
        <span className="overview-card__who">
          <span className="overview-card__name">{name}</span>
          <span className="overview-card__moment">{moment}</span>
        </span>
        <StatusPill status={status} size="sm" />
      </span>
      <span className="overview-card__reading">
        <AnimatedNumber
          value={toUnits(glucose, units)}
          decimals={units === MMOL ? 1 : 0}
          className="overview-card__value tabular"
        />
        <span className="overview-card__unit">{unitLabel(units)}</span>
        {dir && <Icon name={TREND_ICON[dir]} size={18} strokeWidth={2.4} className="overview-card__trend" />}
      </span>
      <RiskHorizon status={status} risk={risk} compact />
      <span className="overview-card__risk" style={{ color: info.text }}>
        {pct !== null ? (
          <>
            <AnimatedNumber value={pct} className="tabular" />% chance of a low
          </>
        ) : (
          info.label
        )}
      </span>
    </Link>
  )
}
