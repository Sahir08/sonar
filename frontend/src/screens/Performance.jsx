import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { Disclaimer } from '../components/ui/Notices.jsx'
import Page from '../components/ui/Page.jsx'
import Skeleton, { LoadingRegion } from '../components/ui/Skeleton.jsx'
import { EmptyState, ErrorState } from '../components/ui/StateMessage.jsx'
import { APP_NAME } from '../constants.js'
import { useApi } from '../hooks/useApi.js'
import { demoApi } from '../lib/cache.js'
import './Performance.css'

const ok = (v) => v !== null && v !== undefined && !Number.isNaN(v)
const round1 = (v) => Math.round(v * 10) / 10
const fmt = (v, suffix = '') => (ok(v) ? `${v}${suffix}` : '—')

const MODELS = [
  { key: 'glucose_only', title: APP_NAME, sub: 'Glucose only', main: true },
  { key: 'full_model', title: 'Full model', sub: 'Glucose + insulin + carbs + activity' },
  { key: 'baseline', title: 'Baseline', sub: 'Standard trend alert' },
]

/** Plain-language takeaway built only from the API's numbers. */
function takeaway(perf) {
  const main = perf[perf.main_model] ?? perf.glucose_only
  const base = perf.baseline
  if (!main || !base || !ok(main.warned_pct) || !ok(main.median_lead_min)) return null
  const parts = [
    `On ${perf.test_patients} patients the model never saw, ${APP_NAME} warned ahead of ${main.warned_pct}% of lows, a median of ${main.median_lead_min} minutes before`,
  ]
  if (ok(base.median_lead_min)) {
    const diff = round1(main.median_lead_min - base.median_lead_min)
    if (diff > 0) parts.push(`${diff} minutes earlier than a standard trend alert`)
    else if (diff < 0) parts.push(`${Math.abs(diff)} minutes later than a standard trend alert`)
    else parts.push('at the same time as a standard trend alert')
  }
  let sentence = parts.join(', ')
  if (ok(main.false_alarms_per_day) && ok(base.false_alarms_per_day)) {
    const fa = round1(main.false_alarms_per_day - base.false_alarms_per_day)
    if (fa > 0) sentence += `, with about ${fa} more false alarms per day`
    else if (fa < 0) sentence += `, with about ${Math.abs(fa)} fewer false alarms per day`
    else sentence += ', with the same number of false alarms per day'
  }
  return `${sentence}.`
}

export default function Performance() {
  const { data, error, loading, retry } = useApi(demoApi.performance, 'performance')
  const back = { to: '/', label: 'Home' }

  if (error) {
    return (
      <Page title="Model performance" back={back}>
        <ErrorState error={error} onRetry={retry} />
      </Page>
    )
  }
  if (loading) {
    return (
      <Page title="Model performance" back={back}>
        <LoadingRegion label="Loading performance" className="perf__cards">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton width="50%" height={18} />
              <Skeleton height={120} radius={14} style={{ marginTop: 16 }} />
            </Card>
          ))}
        </LoadingRegion>
      </Page>
    )
  }
  if (!data) {
    return (
      <Page title="Model performance" back={back}>
        <EmptyState title="No performance results are available." />
      </Page>
    )
  }

  const summary = takeaway(data)
  return (
    <Page title="Model performance" back={back}>
      {summary && <p className="perf__takeaway">{summary}</p>}

      <ul className="perf__cards">
        {MODELS.map((m) => {
          const r = data[m.key] ?? {}
          const isMain = m.key === (data.main_model ?? 'glucose_only')
          return (
            <li key={m.key}>
              <Card className={`perf-card ${isMain ? 'is-main' : ''}`}>
                <div className="perf-card__head">
                  <h2 className="perf-card__title">{m.title}</h2>
                  {isMain && <span className="perf-card__tag">Used in the app</span>}
                </div>
                <p className="perf-card__sub">{m.sub}</p>
                <dl className="perf-card__metrics">
                  <div>
                    <dt>Lows warned</dt>
                    <dd className="tabular">{fmt(r.warned_pct, '%')}</dd>
                  </div>
                  <div>
                    <dt>Median warning</dt>
                    <dd className="tabular">
                      {fmt(r.median_lead_min)} <small>min before</small>
                    </dd>
                  </div>
                  <div>
                    <dt>False alarms</dt>
                    <dd className="tabular">
                      {fmt(r.false_alarms_per_day)} <small>per day</small>
                    </dd>
                  </div>
                </dl>
              </Card>
            </li>
          )
        })}
      </ul>
      <p className="perf__footnote">
        Results on {fmt(data.test_patients)} held-out test patients, looking {fmt(data.horizon_min)} minutes ahead. Full
        model validation AUROC: <strong className="tabular">{fmt(data.full_model_val_auroc)}</strong>.
      </p>

      <Card className="perf__section">
        <h2 className="perf__heading">Why glucose-only</h2>
        <p>
          Adding insulin, carbs, and activity data did not improve accuracy, so {APP_NAME} works with just a CGM. That
          also means it works for anyone with glucose data, even without a pump or activity tracker.
        </p>
      </Card>

      <Card className="perf__section">
        <h2 className="perf__heading">Limitations</h2>
        <ul className="perf__list">
          <li>Small dataset: 25 people.</li>
          <li>Research data from one study.</li>
          <li>The preprocessed data may include filled-in values.</li>
          <li>Not clinically validated.</li>
        </ul>
      </Card>

      <div className="page-cta">
        <Button variant="primary" size="lg" to="/demo" iconRight="arrowRight">
          Try the demo
        </Button>
      </div>

      <Disclaimer />
    </Page>
  )
}
