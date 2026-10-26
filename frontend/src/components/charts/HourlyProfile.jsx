import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { HIGH, LOW, VERY_HIGH, VERY_LOW } from '../../constants.js'
import { hourLabel } from '../../lib/format.js'
import { MMOL, formatGlucose, glucoseDomain, toUnits, unitLabel } from '../../lib/units.js'
import './charts.css'

const ok = (v) => v !== null && v !== undefined && !Number.isNaN(v)
const pair = (a, b) => (ok(a) && ok(b) ? [a, b] : null)

function ProfileTooltip({ active, payload, units }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const u = unitLabel(units)
  const fmt = (v) => formatGlucose(v, units)
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{hourLabel(d.hour)}</p>
      <p>
        Median <strong>{fmt(d.raw.p50)}</strong> {u}
      </p>
      <p>
        Middle half {fmt(d.raw.p25)}–{fmt(d.raw.p75)}
      </p>
      <p>
        Most readings (5th–95th) {fmt(d.raw.p5)}–{fmt(d.raw.p95)}
      </p>
    </div>
  )
}

/**
 * Glucose by hour of day: median line, 25th–75th band, 5th–95th lighter band, 70–180 target band.
 */
export default function HourlyProfile({ profile, units, height = 260 }) {
  const data = Array.from({ length: 24 }, (_, h) => {
    const raw = {
      p5: profile?.p5?.[h] ?? null,
      p25: profile?.p25?.[h] ?? null,
      p50: profile?.p50?.[h] ?? null,
      p75: profile?.p75?.[h] ?? null,
      p95: profile?.p95?.[h] ?? null,
    }
    const c = (v) => toUnits(v, units)
    return {
      hour: h,
      raw,
      outer: pair(c(raw.p5), c(raw.p95)),
      inner: pair(c(raw.p25), c(raw.p75)),
      median: c(raw.p50),
    }
  })

  const [yMin, yMax] = glucoseDomain(units)
  const yTicks = [VERY_LOW, LOW, HIGH, VERY_HIGH].map((v) => toUnits(v, units))
  const fmtTick = (v) => (units === MMOL ? v.toFixed(1) : String(Math.round(v)))
  const medians = profile?.p50?.filter(ok) ?? []
  const summary = medians.length
    ? `Glucose by hour of day. Median ranges from ${formatGlucose(Math.min(...medians), units)} to ${formatGlucose(Math.max(...medians), units)} ${unitLabel(units)}.`
    : 'Glucose by hour of day. No data.'

  return (
    <figure className="profile">
      <div className="profile__plot" role="img" aria-label={summary} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
            <XAxis
              dataKey="hour"
              type="number"
              domain={[0, 23]}
              ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
              tickFormatter={hourLabel}
              tick={{ fill: 'var(--text-2)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tickMargin={8}
            />
            <YAxis
              type="number"
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickFormatter={fmtTick}
              allowDataOverflow
              tick={{ fill: 'var(--text-2)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <ReferenceArea y1={toUnits(LOW, units)} y2={toUnits(HIGH, units)} fill="var(--calm)" fillOpacity={0.1} stroke="none" />
            <ReferenceLine y={toUnits(LOW, units)} stroke="var(--calm)" strokeOpacity={0.5} strokeDasharray="4 4" />
            <ReferenceLine y={toUnits(HIGH, units)} stroke="var(--calm)" strokeOpacity={0.5} strokeDasharray="4 4" />
            <Area
              dataKey="outer"
              type="monotone"
              stroke="none"
              fill="var(--text-2)"
              fillOpacity={0.16}
              connectNulls={false}
              isAnimationActive={false}
              activeDot={false}
            />
            <Area
              dataKey="inner"
              type="monotone"
              stroke="none"
              fill="var(--text-2)"
              fillOpacity={0.34}
              connectNulls={false}
              isAnimationActive={false}
              activeDot={false}
            />
            <Line
              dataKey="median"
              type="monotone"
              stroke="var(--text)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--text)', stroke: 'var(--surface)', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Tooltip
              content={<ProfileTooltip units={units} />}
              cursor={{ stroke: 'var(--text-3)', strokeDasharray: '3 3' }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="profile__legend" aria-label="Legend">
        <li>
          <span className="profile__key profile__key--line" />
          Median
        </li>
        <li>
          <span className="profile__key" style={{ background: 'color-mix(in srgb, var(--text-2) 34%, transparent)' }} />
          Middle half (25th–75th)
        </li>
        <li>
          <span className="profile__key" style={{ background: 'color-mix(in srgb, var(--text-2) 16%, transparent)' }} />
          Most readings (5th–95th)
        </li>
        <li>
          <span className="profile__key profile__key--target" />
          Target {units === MMOL ? '3.9–10.0' : '70–180'}
        </li>
      </ul>
    </figure>
  )
}
