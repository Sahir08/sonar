import { formatPercent } from '../../lib/format.js'
import './charts.css'

const ok = (v) => v !== null && v !== undefined && !Number.isNaN(v)

/**
 * Stacked horizontal bar of time spent in each range, with a legend that carries every value
 * (so identity never depends on color alone). segments: [{ key, label, sub, value (%), color }]
 */
export default function RangeBar({ segments, label }) {
  const shown = segments.filter((s) => ok(s.value) && s.value > 0)
  const summary = segments.map((s) => `${s.label} ${formatPercent(s.value, 1)}`).join(', ')
  return (
    <div className="range-bar">
      <div className="range-bar__bar" role="img" aria-label={`${label}: ${summary}`}>
        {shown.map((s) => (
          <span
            key={s.key}
            className="range-bar__seg"
            style={{ flexGrow: s.value, background: s.color }}
            title={`${s.label} (${s.sub}): ${formatPercent(s.value, 1)}`}
          />
        ))}
      </div>
      <ul className="range-bar__legend">
        {segments.map((s) => (
          <li key={s.key}>
            <span className="range-bar__swatch" style={{ background: s.color }} aria-hidden="true" />
            <span className="range-bar__name">
              {s.label}
              <span className="range-bar__sub">{s.sub}</span>
            </span>
            <span className="range-bar__value tabular">{formatPercent(s.value, 1)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
