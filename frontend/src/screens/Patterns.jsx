import SourceSwitcher from '../components/layout/SourceSwitcher.jsx'
import { Link, useParams } from 'react-router-dom'
import { HourStrip, LowsByPeriod } from '../components/charts/LowsByTime.jsx'
import RangeBar from '../components/charts/RangeBar.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Icon from '../components/ui/Icon.jsx'
import Page from '../components/ui/Page.jsx'
import Skeleton, { LoadingRegion } from '../components/ui/Skeleton.jsx'
import { EmptyState, ErrorState } from '../components/ui/StateMessage.jsx'
import { useSettings } from '../context/settings.js'
import { useSourceDoc } from '../hooks/useSourceDoc.js'
import { formatDateLong, formatInt, formatPercent, parseDate } from '../lib/format.js'
import { threeRanges } from '../lib/ranges.js'
import { formatGlucose, unitLabel } from '../lib/units.js'
import './Patterns.css'

export default function Patterns({ source }) {
  const { data, error, loading, retry, name, notFound } = useSourceDoc(source, 'patterns')
  const { units } = useSettings()
  const { id } = useParams()
  const switcher = <SourceSwitcher name={name} />

  // Daily rows open Today at that day's first reading (replay sources only)
  let dayLink = null
  if (source === 'demo') dayLink = (day) => `/demo/${encodeURIComponent(id)}?day=${day}`
  if (source === 'upload') dayLink = (day) => `/upload/dashboard?day=${day}`

  if (notFound) {
    return (
      <Page title="Patterns">
        <EmptyState title="We couldn't find that demo patient." action={<Button to="/demo">See all demo patients</Button>} />
      </Page>
    )
  }
  if (error) {
    return (
      <Page title="Patterns" switcher={switcher}>
        <ErrorState error={error} onRetry={retry} />
      </Page>
    )
  }
  if (loading || !data) {
    return (
      <Page title="Patterns" switcher={switcher}>
        <LoadingRegion label="Loading patterns" className="patterns">
          {[120, 220, 140].map((h) => (
            <Card key={h}>
              <Skeleton width="40%" height={16} />
              <Skeleton height={h} radius={14} style={{ marginTop: 14 }} />
            </Card>
          ))}
        </LoadingRegion>
      </Page>
    )
  }

  const days = data.days ?? null
  return (
    <Page
      title="Patterns"
      switcher={switcher}
      eyebrow={`${name ?? ''}${days !== null ? ` · all ${days} days of data` : ''}`}
    >
      <div className="patterns">
        <Card className="patterns__tir">
          <h2 className="patterns__heading">Time in range</h2>
          <p className="patterns__hero">
            <span className="patterns__hero-value tabular">{formatPercent(data.time_in_range)}</span>
            <span className="patterns__hero-label">
              of readings were in range ({units === 'mmol' ? '3.9–10.0' : '70–180'} {unitLabel(units)})
            </span>
          </p>
          <RangeBar label="Time in range" segments={threeRanges(data, units)} />
        </Card>

        <Card className="patterns__lows">
          <h2 className="patterns__heading">Lows by time of day</h2>
          {data.lows === 0 ? (
            <p className="patterns__muted">No lows in this period.</p>
          ) : (
            <>
              <p className="patterns__muted">
                {formatInt(data.lows)} lows in total. A low starts when glucose drops below{' '}
                {units === 'mmol' ? '3.9' : '70'} {unitLabel(units)}.
              </p>
              <LowsByPeriod lowsByPeriod={data.lows_by_period} />
              <HourStrip lowsByHour={data.lows_by_hour} />
            </>
          )}
        </Card>

        <Card className="patterns__insights">
          <h2 className="patterns__heading">Insights</h2>
          {data.insights?.length ? (
            <ul className="insights">
              {data.insights.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          ) : (
            <p className="patterns__muted">No insights for this period.</p>
          )}
        </Card>

        <Card className="patterns__daily">
          <h2 className="patterns__heading">Day by day</h2>
          {dayLink && data.daily?.length > 0 && <p className="patterns__muted">Select a date to replay that day.</p>}
          <DailyTable daily={data.daily ?? []} units={units} dayLink={dayLink} />
        </Card>
      </div>
    </Page>
  )
}

function DailyTable({ daily, units, dayLink }) {
  if (!daily.length) return <p className="patterns__muted">No daily data.</p>
  return (
    <div className="table-scroll">
      <table className="daily-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col" className="num">
              In range
            </th>
            <th scope="col" className="num">
              Lows
            </th>
            <th scope="col" className="num">
              Alerts
            </th>
            <th scope="col" className="num">
              Mean ({unitLabel(units)})
            </th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}>
              <th scope="row">
                {dayLink ? (
                  <Link to={dayLink(d.date)} className="daily-table__day">
                    {formatDateLong(parseDate(d.date))}
                    <Icon name="chevronRight" size={16} />
                  </Link>
                ) : (
                  formatDateLong(parseDate(d.date))
                )}
              </th>
              <td className="num tabular">{formatPercent(d.time_in_range)}</td>
              <td className="num tabular">{formatInt(d.lows)}</td>
              <td className="num tabular">{formatInt(d.alerts)}</td>
              <td className="num tabular">{formatGlucose(d.mean_glucose, units)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
