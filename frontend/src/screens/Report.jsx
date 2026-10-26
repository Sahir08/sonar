import SourceSwitcher from '../components/layout/SourceSwitcher.jsx'
import HourlyProfile from '../components/charts/HourlyProfile.jsx'
import { LowsByPeriod } from '../components/charts/LowsByTime.jsx'
import RangeBar from '../components/charts/RangeBar.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Logo from '../components/ui/Logo.jsx'
import { Disclaimer } from '../components/ui/Notices.jsx'
import Page, { PageTopBar } from '../components/ui/Page.jsx'
import Skeleton, { LoadingRegion } from '../components/ui/Skeleton.jsx'
import { EmptyState, ErrorState } from '../components/ui/StateMessage.jsx'
import { APP_NAME } from '../constants.js'
import { useSettings } from '../context/settings.js'
import { useSourceDoc } from '../hooks/useSourceDoc.js'
import { formatDateYear, formatInt, formatPercent, parseDate } from '../lib/format.js'
import { fiveRanges } from '../lib/ranges.js'
import { formatGlucose, unitLabel } from '../lib/units.js'
import './Patterns.css'
import './Report.css'

export default function Report({ source }) {
  const { data, error, loading, retry, name, notFound } = useSourceDoc(source, 'report')
  const { units } = useSettings()
  const switcher = <SourceSwitcher name={name} />

  if (notFound) {
    return (
      <Page title="Glucose report">
        <EmptyState title="We couldn't find that demo patient." action={<Button to="/demo">See all demo patients</Button>} />
      </Page>
    )
  }
  if (error) {
    return (
      <Page title="Glucose report" switcher={switcher}>
        <ErrorState error={error} onRetry={retry} />
      </Page>
    )
  }
  if (loading || !data) {
    return (
      <Page title="Glucose report" switcher={switcher}>
        <LoadingRegion label="Loading report" className="report">
          <div className="report__tiles">
            {[0, 1, 2].map((i) => (
              <Card key={i} size="sm">
                <Skeleton width="60%" height={13} />
                <Skeleton width="50%" height={28} style={{ marginTop: 10 }} />
              </Card>
            ))}
          </div>
          <Card>
            <Skeleton height={260} radius={14} />
          </Card>
        </LoadingRegion>
      </Page>
    )
  }

  const start = formatDateYear(parseDate(data.period?.start))
  const end = formatDateYear(parseDate(data.period?.end))
  const u = unitLabel(units)

  return (
    <article className="report">
      <PageTopBar switcher={switcher} className="report__topbar" />
      <header className="report__header">
        <div className="report__brand">
          <Logo size={32} />
          <span>{APP_NAME}</span>
        </div>
        <Button variant="primary" icon="print" className="report__print" onClick={() => window.print()}>
          Save as PDF
        </Button>
      </header>

      <div className="report__title-block">
        <h1 className="report__title">Glucose report</h1>
        <p className="report__meta">
          {name && <span>{name}</span>}
          <span>
            {start} – {end}
          </span>
          <span>{data.days ?? '—'} days</span>
          <span>{formatPercent(data.data_coverage_pct, 1)} data coverage</span>
        </p>
      </div>

      <section className="report__tiles" aria-label="Key metrics">
        <Card size="sm" className="metric">
          <span className="metric__label">Mean glucose</span>
          <span className="metric__value tabular">
            {formatGlucose(data.mean_glucose, units)} <small>{u}</small>
          </span>
        </Card>
        <Card size="sm" className="metric">
          <span className="metric__label">GMI (estimated A1C)</span>
          <span className="metric__value tabular">{formatPercent(data.gmi_pct, 1)}</span>
        </Card>
        <Card size="sm" className="metric">
          <span className="metric__label">CV (glucose variability)</span>
          <span className="metric__value tabular">{formatPercent(data.cv_pct, 1)}</span>
        </Card>
      </section>

      <Card className="report__section">
        <h2 className="report__heading">Time in ranges</h2>
        <RangeBar label="Time in ranges" segments={fiveRanges(data.ranges ?? {}, units)} />
      </Card>

      <Card className="report__section">
        <h2 className="report__heading">Glucose by hour of day</h2>
        <p className="report__note">All days combined. Hours run midnight to midnight.</p>
        <HourlyProfile profile={data.hourly_profile} units={units} />
      </Card>

      <div className="report__pair">
        <Card className="report__section">
          <h2 className="report__heading">Lows by time of day</h2>
          {data.lows === 0 ? (
            <p className="report__note">No lows in this period.</p>
          ) : (
            <LowsByPeriod lowsByPeriod={data.lows_by_period} />
          )}
        </Card>

        <Card className="report__section">
          <h2 className="report__heading">{APP_NAME}&apos;s warnings</h2>
          {data.lows ? (
            <p className="report__warned">
              {APP_NAME} warned ahead of <strong className="tabular">{formatInt(data.lows_warned)}</strong> of{' '}
              <strong className="tabular">{formatInt(data.lows)}</strong> lows
            </p>
          ) : (
            <p className="report__note">No lows in this period.</p>
          )}
          {data.model && (
            <p className="report__note">
              Model: {data.model.name}. Looks {data.model.horizon_min} minutes ahead using glucose data only.
            </p>
          )}
        </Card>
      </div>

      <Card className="report__section">
        <h2 className="report__heading">Insights</h2>
        {data.insights?.length ? (
          <ul className="insights">
            {data.insights.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        ) : (
          <p className="report__note">No insights for this period.</p>
        )}
      </Card>

      <Disclaimer className="report__disclaimer" />
    </article>
  )
}
