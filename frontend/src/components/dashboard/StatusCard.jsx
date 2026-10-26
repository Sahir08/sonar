import { trendDirection, trendText, unitLabel, toUnits, MMOL } from '../../lib/units.js'
import AnimatedNumber from '../ui/AnimatedNumber.jsx'
import Card from '../ui/Card.jsx'
import Icon from '../ui/Icon.jsx'
import StatusPill from '../ui/StatusPill.jsx'
import RiskHorizon from './RiskHorizon.jsx'
import './StatusCard.css'

const TREND_ICON = { falling: 'arrowDown', rising: 'arrowUp', steady: 'arrowRight' }

/** Current glucose, trend, status pill, and the risk horizon. */
export default function StatusCard({ glucose, trend, status, risk, units, action }) {
  const dir = trendDirection(trend)
  return (
    <Card className="status-card" aria-label="Current status">
      <div className="status-card__top">
        <span className="status-card__label">Glucose</span>
        <StatusPill status={status} />
      </div>
      <p className="status-card__reading">
        <AnimatedNumber
          value={toUnits(glucose, units)}
          decimals={units === MMOL ? 1 : 0}
          className="status-card__value tabular"
        />
        <span className="status-card__unit">{unitLabel(units)}</span>
      </p>
      <div className="status-card__trend-row">
        <p className={`status-card__trend ${dir ? '' : 'is-missing'}`}>
          {dir && <Icon name={TREND_ICON[dir]} size={16} strokeWidth={2.4} />}
          <span>{dir ? trendText(trend, units) : 'Trend not available'}</span>
        </p>
        {action}
      </div>
      <RiskHorizon status={status} risk={risk} />
    </Card>
  )
}
