import { motion } from 'motion/react'
import { useApi } from '../../hooks/useApi.js'
import { contextItems, groupValue, organizeGroups } from '../../lib/explain.js'
import { formatClock, parseTime } from '../../lib/format.js'
import { staggerList } from '../../lib/motion.js'
import { riskPercent } from '../../lib/status.js'
import { hourChange } from '../../lib/timeline.js'
import { changeText } from '../../lib/units.js'
import BottomSheet from '../ui/BottomSheet.jsx'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'
import { EmptyState, ErrorState } from '../ui/StateMessage.jsx'
import { FactorCard, SmallFactorRow } from './FactorCard.jsx'
import './WhySheet.css'

/**
 * "Why this alert" sheet for the moment at `index`.
 * loadExplanation(index, signal) resolves to an EXPLANATION, or null when none exists for that moment.
 * It is only called when the sheet is opened (index set), never on replay ticks.
 * onGoTo: moves the replay to this moment (replay only, when it isn't the current moment).
 */
export default function WhySheet({ open, onClose, index, timeline, loadExplanation, units, onGoTo }) {
  const result = useApi(
    (signal) => loadExplanation(index, signal),
    index === null || index === undefined ? null : `why:${timeline.time[index]}`,
  )
  const explanation = result.data
  const isAlert = timeline.alert?.[index] === true
  const title = isAlert ? 'Why this alert' : 'Why this risk level'

  const time = parseTime(explanation?.time ?? timeline.time[index])
  const pct = riskPercent(explanation?.risk)
  const subtitle = pct !== null ? `${formatClock(time)} · ${pct}% chance of a low in the next hour` : formatClock(time)

  let body
  if (result.loading) {
    body = <WhySkeleton />
  } else if (result.error) {
    body = <ErrorState error={result.error} onRetry={result.retry} />
  } else if (!explanation) {
    body = <EmptyState title="Explanations are available for alert moments." />
  } else {
    body = <WhyContent explanation={explanation} timeline={timeline} index={index} units={units} />
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title} subtitle={subtitle}>
      {body}
      {onGoTo && (
        <div className="why__goto">
          <Button variant="secondary" icon="clock" onClick={onGoTo}>
            Go to this moment
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}

function WhyContent({ explanation, timeline, index, units }) {
  const { increasing, lowering, small } = organizeGroups(explanation)
  // Uses only readings at or before this moment
  const change = changeText(hourChange(timeline.glucose, index), units)

  const card = (group, tone) => (
    <FactorCard
      key={group.group}
      group={group}
      tone={tone}
      value={groupValue(group, explanation, units)}
      subline={group.group === 'Glucose trend' && change ? `${change} in the last hour` : null}
    />
  )

  return (
    <div className="why">
      {increasing.length > 0 && (
        <section className="why__section">
          <h3 className="why__heading" style={{ color: 'var(--high-text)' }}>
            <Icon name="arrowUp" size={14} strokeWidth={2.6} />
            Increasing risk
          </h3>
          <motion.ul className="why__cards" variants={staggerList} initial="hidden" animate="show">
            {increasing.map((g) => card(g, 'var(--high)'))}
          </motion.ul>
        </section>
      )}

      {lowering.length > 0 && (
        <section className="why__section">
          <h3 className="why__heading" style={{ color: 'var(--calm-text)' }}>
            <Icon name="arrowDown" size={14} strokeWidth={2.6} />
            Lowering risk
          </h3>
          <motion.ul className="why__cards" variants={staggerList} initial="hidden" animate="show">
            {lowering.map((g) => card(g, 'var(--calm)'))}
          </motion.ul>
        </section>
      )}

      {small.length > 0 && (
        <ul className="why__small" aria-label="Smaller factors">
          {small.map((g) => (
            <SmallFactorRow key={g.group} group={g} value={groupValue(g, explanation, units)} />
          ))}
        </ul>
      )}

      <section className="why__context">
        <h3 className="section-label">What else was happening</h3>
        <ul className="why__context-grid">
          {contextItems(explanation.context).map((item) => (
            <li key={item.label}>
              <span className="why__context-label">{item.label}</span>
              <span className={`why__context-value ${item.value === 'Not available' ? 'is-missing' : ''}`}>
                {item.value}
              </span>
            </li>
          ))}
        </ul>
        {explanation.context?.note && <p className="why__note">{explanation.context.note}</p>}
      </section>
    </div>
  )
}

function WhySkeleton() {
  return (
    <LoadingRegion label="Loading explanation" className="why">
      <Skeleton width={130} height={14} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="why__skeleton-card">
          <Skeleton width="45%" height={16} />
          <Skeleton height={8} radius={999} style={{ marginTop: 14 }} />
        </div>
      ))}
    </LoadingRegion>
  )
}
