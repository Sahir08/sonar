import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import Page from '../components/ui/Page.jsx'
import Skeleton, { LoadingRegion } from '../components/ui/Skeleton.jsx'
import { EmptyState, ErrorState } from '../components/ui/StateMessage.jsx'
import { useApi } from '../hooks/useApi.js'
import { demoApi } from '../lib/cache.js'
import './PatientPicker.css'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function PatientPicker() {
  const { data, error, loading, retry } = useApi(demoApi.patients, 'patients')

  let body
  if (error) {
    body = <ErrorState error={error} onRetry={retry} />
  } else if (loading) {
    body = (
      <LoadingRegion label="Loading demo patients" className="picker">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="picker__card">
            <Skeleton width={44} height={44} radius={14} />
            <div style={{ flex: 1 }}>
              <Skeleton width="55%" height={16} />
              <Skeleton width="70%" height={13} style={{ marginTop: 8 }} />
            </div>
          </div>
        ))}
      </LoadingRegion>
    )
  } else if (!data?.length) {
    body = <EmptyState title="No demo patients are available." />
  } else {
    body = (
      <ul className="picker">
        <li>
          <Link to="/demo/overview" className="picker__card picker__card--overview">
            <span className="picker__icon">
              <Icon name="overview" size={22} />
            </span>
            <span className="picker__text">
              <span className="picker__name">Overview</span>
              <span className="picker__meta">All {data.length} patients on one shared replay clock</span>
            </span>
            <Icon name="chevronRight" size={20} className="picker__chevron" />
          </Link>
        </li>
        {data.map((p, i) => (
          <li key={p.id}>
            <Link to={`/demo/${encodeURIComponent(p.id)}`} className="picker__card">
              <span className="picker__icon">
                <Icon name="user" size={22} />
              </span>
              <span className="picker__text">
                <span className="picker__name">Demo patient {i + 1}</span>
                <span className="picker__meta">
                  {p.days ?? '—'} days of data · {p.lows === null || p.lows === undefined ? '— lows' : plural(p.lows, 'low')}
                </span>
              </span>
              <Icon name="chevronRight" size={20} className="picker__chevron" />
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Page title="Demo patients" back={{ to: '/', label: 'Home' }}>
      <p className="picker__intro">
        Replay real CGM data from people the model never saw during training, and watch Sonar warn ahead of lows.
      </p>
      {body}
    </Page>
  )
}
