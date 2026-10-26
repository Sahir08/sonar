import Card from '../ui/Card.jsx'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'
import './DashboardView.css'

/** Shimmer layout matching the dashboard while data loads. */
export default function DashboardSkeleton({ label = 'Loading dashboard' }) {
  return (
    <LoadingRegion label={label} className="page">
      <div>
        <Skeleton width={120} height={14} />
        <Skeleton width={220} height={34} style={{ marginTop: 10 }} />
      </div>
      <div className="dashboard__grid">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Skeleton width={60} height={14} />
            <Skeleton width={96} height={30} radius={999} />
          </div>
          <Skeleton width={150} height={56} style={{ marginTop: 8 }} />
          <Skeleton width={190} height={16} style={{ marginTop: 12 }} />
          <Skeleton height={36} radius={12} style={{ marginTop: 28 }} />
        </Card>
        <Card>
          <Skeleton width={100} height={16} />
          <Skeleton height={200} radius={14} style={{ marginTop: 14 }} />
        </Card>
      </div>
    </LoadingRegion>
  )
}
