import { hourLabel } from '../../lib/format.js'
import { periodsInOrder } from '../../lib/ranges.js'
import './charts.css'

const plural = (n) => `${n} low${n === 1 ? '' : 's'}`

/** Horizontal bars of lows per part of the day. */
export function LowsByPeriod({ lowsByPeriod }) {
  const periods = periodsInOrder(lowsByPeriod)
  const max = Math.max(0, ...periods.map((p) => p.count ?? 0))
  return (
    <ul className="period-bars" aria-label="Lows by time of day">
      {periods.map((p) => (
        <li key={p.key} className="period-bars__row" title={`${p.name} (${p.hours}): ${plural(p.count ?? 0)}`}>
          <span className="period-bars__label">
            {p.name}
            <span className="period-bars__hours">{p.hours}</span>
          </span>
          <span className="period-bars__track" aria-hidden="true">
            {max > 0 && p.count > 0 && <span className="period-bars__fill" style={{ width: `${(p.count / max) * 100}%` }} />}
          </span>
          <span className="period-bars__count tabular">{p.count ?? '—'}</span>
        </li>
      ))}
    </ul>
  )
}

const STRIP_LABELS = [0, 6, 12, 18]

/** 24 cells, one per hour; deeper color = more lows that hour. */
export function HourStrip({ lowsByHour }) {
  const hours = Array.from({ length: 24 }, (_, h) => lowsByHour?.[h] ?? null)
  const max = Math.max(0, ...hours.map((v) => v ?? 0))
  const busiest = max > 0 ? hours.map((v, h) => (v === max ? hourLabel(h) : null)).filter(Boolean) : []
  const summary =
    max > 0 ? `Lows by hour of day. Most lows at ${busiest.join(', ')} (${plural(max)}).` : 'No lows by hour of day.'

  return (
    <figure className="hour-strip">
      <div className="hour-strip__cells" role="img" aria-label={summary}>
        {hours.map((v, h) => {
          const strength = max > 0 && v ? 0.18 + 0.82 * (v / max) : 0
          return (
            <span
              key={h}
              className="hour-strip__cell"
              style={strength ? { background: `color-mix(in srgb, var(--low-now) ${Math.round(strength * 100)}%, var(--surface-2))` } : undefined}
              title={`${hourLabel(h)}: ${v === null ? 'no data' : plural(v)}`}
            />
          )
        })}
      </div>
      <div className="hour-strip__axis" aria-hidden="true">
        {STRIP_LABELS.map((h) => (
          <span key={h} style={{ left: `${(h / 24) * 100}%` }}>
            {hourLabel(h)}
          </span>
        ))}
      </div>
      <figcaption className="hour-strip__caption">
        Each cell is one hour. Deeper color means more lows started in that hour.
      </figcaption>
    </figure>
  )
}
