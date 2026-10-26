import { motion, useReducedMotion } from 'motion/react'
import { smooth } from '../../lib/motion.js'
import { STATUS, riskPercent, showsRisk, statusInfo } from '../../lib/status.js'
import AnimatedNumber from '../ui/AnimatedNumber.jsx'
import './RiskHorizon.css'

const FILL_STATUSES = ['low_risk', 'watch', 'high']
const TICKS = ['Now', '+15', '+30', '+45', '+60 min']

/**
 * The next-hour risk horizon: fill width = risk %, color = status color fading to the right.
 * compact: band only (for overview cards).
 */
export default function RiskHorizon({ status, risk, compact = false }) {
  const reduce = useReducedMotion()
  const info = statusInfo(status)
  const pct = showsRisk(status) ? riskPercent(risk) : null
  const width = pct ?? 0

  let headline
  if (pct !== null) {
    headline = (
      <>
        <AnimatedNumber value={pct} className="tabular" />% chance of a low
      </>
    )
  } else {
    headline = info.label
  }

  const meterProps =
    pct !== null
      ? {
          role: 'meter',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': pct,
          'aria-valuetext': `${pct}% chance of a low in the next hour`,
          'aria-label': 'Next-hour risk horizon',
        }
      : { role: 'img', 'aria-label': `Next-hour risk horizon: ${info.label}` }

  return (
    <div className={`horizon ${compact ? 'horizon--compact' : ''}`}>
      {!compact && (
        <div className="horizon__head">
          <span className="horizon__title">Next-hour risk horizon</span>
          <span className="horizon__headline" style={{ color: info.text }}>
            {headline}
          </span>
        </div>
      )}
      <div className="horizon__band" {...meterProps}>
        <motion.div
          className="horizon__fill"
          initial={false}
          animate={{ width: `${width}%` }}
          transition={reduce ? { duration: 0 } : smooth}
        >
          {FILL_STATUSES.map((s) => (
            <motion.span
              key={s}
              className="horizon__layer"
              style={{ '--c': STATUS[s].color }}
              initial={false}
              animate={{ opacity: s === status ? 1 : 0 }}
              transition={smooth}
            />
          ))}
        </motion.div>
        <span className="horizon__now" aria-hidden="true" />
      </div>
      {!compact && (
        <div className="horizon__ticks" aria-hidden="true">
          {TICKS.map((t, i) => (
            <span key={t} style={{ '--pos': `${i * 25}%` }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
