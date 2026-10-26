import DashboardView from '../components/dashboard/DashboardView.jsx'
import { useSession } from '../context/session.js'
import { useArrival } from '../hooks/useArrival.js'
import { useReplay } from '../hooks/useReplay.js'
import { analysisExplanation } from '../lib/analysis.js'
import { firstIndexOfDay, uploadStartIndex } from '../lib/timeline.js'

/** Replay dashboard for uploaded data (route is guarded by RequireData). */
export default function UploadDashboard() {
  const { upload } = useSession()
  const analysis = upload.analysis
  const arrival = useArrival()
  // The position is remembered per upload (keyed by the analysis object, in memory only)
  const replay = useReplay(analysis.time.length, uploadStartIndex(analysis.explanations), {
    initialIndex: firstIndexOfDay(analysis.time, arrival.day),
    memoryKey: analysis,
  })

  return (
    <DashboardView
      title="Your data"
      back={{ to: '/upload', label: 'Upload' }}
      name={null}
      timeline={analysis}
      index={replay.index}
      replay={replay}
      loadExplanation={(i) => Promise.resolve(analysisExplanation(analysis, i))}
      hasExplanation={(i) => analysisExplanation(analysis, i) !== null}
    />
  )
}
