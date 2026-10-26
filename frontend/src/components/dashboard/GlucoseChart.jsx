import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_READINGS, HIGH, LOW, READING_MINUTES } from '../../constants.js'
import { useSmoothValue } from '../../hooks/useSmoothValue.js'
import { hourLabel } from '../../lib/format.js'
import { hasValues, isAlertStart } from '../../lib/timeline.js'
import { formatGlucoseWithUnit, glucoseDomain, toUnits, trendDirection } from '../../lib/units.js'
import Card from '../ui/Card.jsx'
import './GlucoseChart.css'

const MINUTE = 60 * 1000
const WINDOW_MS = CHART_READINGS * READING_MINUTES * MINUTE
const TWO_HOURS = 120 * MINUTE

const hasValue = (v) => v !== null && v !== undefined && !Number.isNaN(v)

function AlertDot({ cx, cy }) {
  if (!hasValue(cx) || !hasValue(cy)) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill="var(--high)" opacity={0.22} />
      <circle cx={cx} cy={cy} r={5} fill="var(--high)" stroke="var(--surface)" strokeWidth={1.5} />
    </g>
  )
}

function CarbsDot({ cx, cy }) {
  if (!hasValue(cx) || !hasValue(cy)) return null
  return <circle cx={cx} cy={cy} r={4} fill="var(--carbs)" />
}

function InsulinTick({ cx, cy }) {
  if (!hasValue(cx) || !hasValue(cy)) return null
  return <rect x={cx - 1.5} y={cy - 6} width={3} height={12} rx={1.5} fill="var(--info)" />
}

/** Even-hour ticks inside the visible window. */
function hourTicks(start, end) {
  const d = new Date(start)
  d.setMinutes(0, 0, 0)
  if (d.getHours() % 2) d.setHours(d.getHours() + 1)
  const ticks = []
  for (let t = d.getTime(); t <= end + 1; t += TWO_HOURS) if (t >= start - 1) ticks.push(t)
  return ticks
}

/**
 * Last 6 hours of glucose up to the current index. Null glucose breaks the line.
 * times: precomputed ms timestamps for each reading.
 */
export default function GlucoseChart({ timeline, times, index, units, trend, speed = 1 }) {
  const { glucose, alert, carbs, bolus } = timeline
  const [yMin, yMax] = glucoseDomain(units)
  const span = yMax - yMin
  // Markers (and their legend entries) only when the data actually exists
  const hasCarbs = useMemo(() => hasValues(carbs), [carbs])
  const hasBolus = useMemo(() => hasValues(bolus), [bolus])

  // One extra reading on the left so the line slides out smoothly
  const data = useMemo(() => {
    const from = Math.max(0, index - CHART_READINGS)
    const line = []
    const alerts = []
    const carbMarks = []
    const insulinMarks = []
    for (let j = from; j <= index; j++) {
      const t = times[j]
      if (!hasValue(t)) continue
      const g = toUnits(glucose?.[j], units)
      line.push({ t, g })
      if (isAlertStart(alert, j) && g !== null) alerts.push({ t, y: g })
      if (hasCarbs && carbs[j] > 0) carbMarks.push({ t, y: yMin + span * 0.085 })
      if (hasBolus && bolus[j] > 0) insulinMarks.push({ t, y: yMin + span * 0.035 })
    }
    return { line, alerts, carbMarks, insulinMarks }
  }, [index, times, glucose, alert, carbs, bolus, units, hasCarbs, hasBolus, yMin, span])

  // The window's right edge glides to the newest reading, so the line extends smoothly
  const fast = speed > 1
  const end = useSmoothValue(times[index], {
    duration: Math.min(0.35, 0.9 / speed),
    ease: fast ? 'linear' : undefined,
    snapOver: 2 * READING_MINUTES * MINUTE,
  })
  const start = end - WINDOW_MS
  const ticks = hourTicks(start, end)

  const current = glucose?.[index]
  const dir = trendDirection(trend)
  const summary = hasValue(current)
    ? `Glucose over the last 6 hours. Now ${formatGlucoseWithUnit(current, units)}${dir ? ` and ${dir}` : ''}.`
    : 'Glucose over the last 6 hours. No current reading.'

  const low = toUnits(LOW, units)
  const high = toUnits(HIGH, units)
  const labelProps = { fill: 'var(--text-3)', fontSize: 11 }

  return (
    <Card className="glucose-chart">
      <h2 className="glucose-chart__title">Last 6 hours</h2>
      <div className="glucose-chart__plot" role="img" aria-label={summary}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 14, bottom: 0, left: 14 }} accessibilityLayer={false}>
            <XAxis
              type="number"
              dataKey="t"
              domain={[start, end]}
              allowDataOverflow
              padding={{ left: 0, right: 10 }}
              ticks={ticks}
              interval={0}
              tickFormatter={(t) => hourLabel(new Date(t).getHours())}
              tick={{ fill: 'var(--text-2)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              height={28}
            />
            <YAxis type="number" domain={[yMin, yMax]} allowDataOverflow hide />
            <ReferenceArea y1={low} y2={high} fill="var(--calm)" fillOpacity={0.08} stroke="none" ifOverflow="hidden" />
            <ReferenceLine
              y={high}
              stroke="var(--calm)"
              strokeOpacity={0.45}
              strokeDasharray="4 4"
              label={{ value: units === 'mmol' ? high.toFixed(1) : String(HIGH), position: 'insideTopLeft', ...labelProps }}
            />
            <ReferenceLine
              y={low}
              stroke="var(--calm)"
              strokeOpacity={0.45}
              strokeDasharray="4 4"
              label={{ value: units === 'mmol' ? low.toFixed(1) : String(LOW), position: 'insideBottomLeft', ...labelProps }}
            />
            <Line
              data={data.line}
              dataKey="g"
              type="monotone"
              stroke="var(--text)"
              strokeWidth={2.25}
              dot={false}
              activeDot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {hasBolus && (
              <Scatter data={data.insulinMarks} dataKey="y" shape={InsulinTick} isAnimationActive={false} />
            )}
            {hasCarbs && <Scatter data={data.carbMarks} dataKey="y" shape={CarbsDot} isAnimationActive={false} />}
            <Scatter data={data.alerts} dataKey="y" shape={AlertDot} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="glucose-chart__legend" aria-label="Legend">
        <li>
          <span className="legend-dot" style={{ background: 'var(--high)' }} />
          Alert
        </li>
        {hasBolus && (
          <li>
            <span className="legend-tick" />
            Insulin
          </li>
        )}
        {hasCarbs && (
          <li>
            <span className="legend-dot" style={{ background: 'var(--carbs)' }} />
            Carbs
          </li>
        )}
        <li>
          <span className="legend-band" />
          Target {units === 'mmol' ? `${low.toFixed(1)}–${high.toFixed(1)}` : `${LOW}–${HIGH}`}
        </li>
      </ul>
    </Card>
  )
}
