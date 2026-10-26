import { formatInt, formatPercent } from '../../lib/format.js'
import './TodaySummary.css'

/** Time in range, low onsets, and alert starts from midnight up to the current moment. */
export default function TodaySummary({ summary }) {
  const items = [
    { label: 'In range today', value: formatPercent(summary.timeInRange) },
    { label: 'Lows today', value: formatInt(summary.lows) },
    { label: 'Alerts today', value: formatInt(summary.alerts) },
  ]
  return (
    <section className="today" aria-label="Today so far">
      {items.map((item) => (
        <div key={item.label} className="today__item">
          <span className="today__label">{item.label}</span>
          <span className="today__value tabular">{item.value}</span>
        </div>
      ))}
    </section>
  )
}
