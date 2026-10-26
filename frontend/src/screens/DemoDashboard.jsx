import { useParams } from 'react-router-dom'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton.jsx'
import DashboardView from '../components/dashboard/DashboardView.jsx'
import Button from '../components/ui/Button.jsx'
import Page from '../components/ui/Page.jsx'
import { EmptyState, ErrorState } from '../components/ui/StateMessage.jsx'
import { useApi } from '../hooks/useApi.js'
import { useArrival } from '../hooks/useArrival.js'
import { useReplay } from '../hooks/useReplay.js'
import { demoApi, demoPatientName } from '../lib/cache.js'
import { firstIndexOfDay, replayStartIndex } from '../lib/timeline.js'

const BACK = { to: '/demo', label: 'Patients' }
const BACK_OVERVIEW = { to: '/demo/overview', label: 'Overview' }

export default function DemoDashboard() {
  const { id } = useParams()
  const arrival = useArrival()
  const patients = useApi(demoApi.patients, 'patients')
  const timeline = useApi((signal) => demoApi.timeline(id, signal), `timeline:${id}`)

  const patient = patients.data?.find((p) => p.id === id)
  const back = arrival.from === 'overview' ? BACK_OVERVIEW : BACK

  if (patients.data && !patient) {
    return (
      <Page title="Patient not found" back={BACK}>
        <EmptyState title="We couldn't find that demo patient." action={<Button to="/demo">See all demo patients</Button>} />
      </Page>
    )
  }

  const error = patients.error || timeline.error
  if (error) {
    return (
      <Page title="Dashboard" back={back}>
        <ErrorState
          error={error}
          onRetry={() => {
            if (patients.error) patients.retry()
            if (timeline.error) timeline.retry()
          }}
        />
      </Page>
    )
  }

  if (!patient || !timeline.data) return <DashboardSkeleton />

  // ?i= (overview, switcher) or ?day= (Patterns) opens at a given moment;
  // otherwise the remembered position, otherwise 2 hours before the first alert
  const initialIndex = arrival.index ?? firstIndexOfDay(timeline.data.time, arrival.day)

  return (
    <DemoReplay
      key={id}
      id={id}
      name={demoPatientName(patients.data, id)}
      timeline={timeline.data}
      startIndex={replayStartIndex(patient.first_alert)}
      initialIndex={initialIndex}
      back={back}
    />
  )
}

function DemoReplay({ id, name, timeline, startIndex, initialIndex, back }) {
  const replay = useReplay(timeline.time.length, startIndex, { initialIndex, memoryKey: `demo:${id}` })
  // Fetched on demand only (Why sheet), cached by index
  const loadExplanation = (i, signal) => demoApi.explain(id, i, signal)
  return (
    <DashboardView
      title={name}
      back={back}
      name={name}
      timeline={timeline}
      index={replay.index}
      replay={replay}
      loadExplanation={loadExplanation}
    />
  )
}
