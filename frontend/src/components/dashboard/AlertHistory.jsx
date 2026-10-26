import { useMemo, useState } from 'react'
import { formatClock, formatDate, parseTime } from '../../lib/format.js'
import { alertOutcome, alertStartsUpTo } from '../../lib/timeline.js'
import Card from '../ui/Card.jsx'
import Icon from '../ui/Icon.jsx'
import './AlertHistory.css'

const OUTCOMES = {
  low: { label: 'Low followed', icon: 'arrowDown', className: 'is-low' },
  none: { label: 'No low', icon: 'check', className: 'is-none' },
  pending: { label: 'Pending', icon: 'clock', className: 'is-pending' },
}

const COLLAPSED = 5

/** Alert starts up to the current moment, newest first, with their outcome so far. */
export default function AlertHistory({ timeline, index, onOpen }) {
  const [showAll, setShowAll] = useState(false)
  const today = timeline.time[index]?.slice(0, 10)

  const alerts = useMemo(
    () =>
      alertStartsUpTo(timeline.alert, index)
        .reverse()
        .map((s) => ({ index: s, outcome: alertOutcome(timeline.glucose, s, index) })),
    [timeline.alert, timeline.glucose, index],
  )

  const visible = showAll ? alerts : alerts.slice(0, COLLAPSED)

  return (
    <Card className="alert-history" aria-labelledby="alert-history-title">
      <h2 id="alert-history-title" className="alert-history__title">
        Alert history
      </h2>
      {alerts.length === 0 ? (
        <p className="alert-history__empty">No alerts yet.</p>
      ) : (
        <ul className="alert-history__list">
          {visible.map(({ index: s, outcome }) => {
            const date = parseTime(timeline.time[s])
            const sameDay = timeline.time[s]?.slice(0, 10) === today
            const o = OUTCOMES[outcome]
            return (
              <li key={s}>
                <button type="button" className="alert-history__row" onClick={() => onOpen?.(s)}>
                  <span className="alert-history__when">
                    <span className="alert-history__time tabular">{formatClock(date)}</span>
                    <span className="alert-history__date">{sameDay ? 'Today' : formatDate(date)}</span>
                  </span>
                  <span className={`alert-history__outcome ${o.className}`}>
                    <Icon name={o.icon} size={16} strokeWidth={2.4} />
                    {o.label}
                  </span>
                  <Icon name="chevronRight" size={18} className="alert-history__chevron" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {alerts.length > COLLAPSED && (
        <button type="button" className="alert-history__more" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show fewer' : `Show all ${alerts.length} alerts`}
        </button>
      )}
    </Card>
  )
}
