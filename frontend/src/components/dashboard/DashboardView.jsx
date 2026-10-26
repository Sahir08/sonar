import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'motion/react'
import { useSettings } from '../../context/settings.js'
import { formatClock, formatDateLong, formatMoment, parseTime } from '../../lib/format.js'
import { getStatus, showsRisk } from '../../lib/status.js'
import { activeAlertStart, todaySummary, trendPerMin } from '../../lib/timeline.js'
import SourceSwitcher from '../layout/SourceSwitcher.jsx'
import Button from '../ui/Button.jsx'
import { Disclaimer } from '../ui/Notices.jsx'
import Page from '../ui/Page.jsx'
import WhySheet from '../why/WhySheet.jsx'
import AlertBanner from './AlertBanner.jsx'
import AlertHistory from './AlertHistory.jsx'
import GlucoseChart from './GlucoseChart.jsx'
import ReplayControls from './ReplayControls.jsx'
import StatusCard from './StatusCard.jsx'
import TodaySummary from './TodaySummary.jsx'
import './DashboardView.css'

/**
 * The dashboard shared by demo, upload, and Nightscout.
 * Everything shown is computed from timeline data up to `index` only.
 * name: patient name for caregiver wording (null for "Your data").
 * replay: replay state from useReplay, or null for live data.
 * loadExplanation(i, signal): resolves to an EXPLANATION or null; called only when the Why sheet opens.
 * hasExplanation(i): whether the "Why?" button can explain moment i (default: always).
 * controls: shown in place of replay controls (e.g. the live refresh bar).
 */
export default function DashboardView({
  title,
  back,
  name,
  timeline,
  index,
  replay,
  loadExplanation,
  hasExplanation,
  controls,
}) {
  const { units, view } = useSettings()
  const times = useMemo(() => timeline.time.map((s) => parseTime(s)?.getTime() ?? null), [timeline.time])

  const glucose = timeline.glucose?.[index] ?? null
  const risk = timeline.risk?.[index] ?? null
  const status = getStatus(glucose, risk, timeline.alert?.[index], timeline.threshold)
  const trend = trendPerMin(timeline.glucose, index)
  const date = parseTime(timeline.time[index])
  const today = useMemo(() => todaySummary(timeline, index), [timeline, index])

  // Why sheet. Moments are tracked by their time so they stay correct if live data refreshes.
  // It keeps the moment while closing so the exit animation shows the same content.
  const [why, setWhy] = useState({ open: false, time: null })
  const openWhy = (i) => {
    replay?.pause()
    setWhy({ open: true, time: timeline.time[i] })
  }
  const closeWhy = () => setWhy((w) => ({ ...w, open: false }))
  const whyFound = why.time ? timeline.time.indexOf(why.time) : -1
  const whyIndex = whyFound >= 0 ? whyFound : null

  // Banner: shown while an alert that has started is still active, until dismissed
  const alertStart = activeAlertStart(timeline.alert, index)
  const alertKey = alertStart !== null ? timeline.time[alertStart] : null
  const [dismissed, setDismissed] = useState(() => new Set())
  const showBanner = alertKey !== null && !dismissed.has(alertKey)
  const bannerText =
    view === 'caregiver' && name ? `${name}: low likely within the hour` : 'Low likely within the hour'

  const canExplainNow = loadExplanation && showsRisk(status) && (hasExplanation ? hasExplanation(index) : true)
  const whyButton =
    canExplainNow ? (
      <Button variant="secondary" size="sm" onClick={() => openWhy(index)}>
        Why?
      </Button>
    ) : null

  return (
    <Page
      className="dashboard"
      eyebrow={formatMoment(date)}
      title={title}
      back={back}
      switcher={<SourceSwitcher name={name} replayIndex={replay ? index : null} />}
    >
      {/* Floating overlay in a portal: never affects page layout */}
      {createPortal(
        <AnimatePresence initial={false}>
          {showBanner && (
            <AlertBanner
              key={alertKey}
              text={bannerText}
              onOpen={() => openWhy(alertStart)}
              onDismiss={() => setDismissed((prev) => new Set(prev).add(alertKey))}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}

      <div className="dashboard__grid">
        <StatusCard
          glucose={glucose}
          trend={trend}
          status={status}
          risk={risk}
          units={units}
          action={whyButton}
        />
        <GlucoseChart
          timeline={timeline}
          times={times}
          index={index}
          units={units}
          trend={trend}
          speed={replay?.speed ?? 1}
        />
        {replay && (
          <div className="dashboard__wide">
            <ReplayControls replay={replay} timeLabel={`${formatDateLong(date)} · ${formatClock(date)}`} />
          </div>
        )}
        {!replay && controls && <div className="dashboard__wide">{controls}</div>}
        <div className="dashboard__wide">
          <AlertHistory timeline={timeline} index={index} onOpen={loadExplanation ? openWhy : undefined} />
        </div>
        <div className="dashboard__wide">
          <TodaySummary summary={today} />
        </div>
      </div>

      <Disclaimer />

      {loadExplanation && (
        <WhySheet
          open={why.open}
          onClose={closeWhy}
          index={whyIndex}
          timeline={timeline}
          loadExplanation={loadExplanation}
          units={units}
          onGoTo={
            replay && whyIndex !== null && whyIndex !== index
              ? () => {
                  replay.seek(whyIndex)
                  closeWhy()
                }
              : null
          }
        />
      )}
    </Page>
  )
}
