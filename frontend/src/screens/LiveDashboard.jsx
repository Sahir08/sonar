import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { api } from '../api.js'
import DashboardView from '../components/dashboard/DashboardView.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { InlineError } from '../components/ui/StateMessage.jsx'
import { useSession } from '../context/session.js'
import { analysisExplanation, latestIndex } from '../lib/analysis.js'
import { formatClock } from '../lib/format.js'
import './LiveDashboard.css'

const REFRESH_MS = 5 * 60 * 1000

/** Live Nightscout dashboard (route is guarded by RequireData). No replay; shows the latest reading. */
export default function LiveDashboard() {
  const { nightscout, setNightscout } = useSession()
  const analysis = nightscout.analysis
  const index = latestIndex(analysis)
  const [refresh, setRefresh] = useState({ busy: false, error: null })
  const controllerRef = useRef(null)

  // Re-POST the same address and token, kept in memory only
  const runRefresh = useCallback(async () => {
    if (controllerRef.current) return // a refresh is already running
    const controller = new AbortController()
    controllerRef.current = controller
    setRefresh({ busy: true, error: null })
    try {
      const next = await api.nightscout({ url: nightscout.url, token: nightscout.token }, controller.signal)
      setNightscout((prev) => (prev ? { ...prev, analysis: next, fetchedAt: Date.now() } : prev))
      setRefresh({ busy: false, error: null })
    } catch (error) {
      if (error.kind !== 'aborted') setRefresh({ busy: false, error })
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [nightscout.url, nightscout.token, setNightscout])

  const onTimer = useEffectEvent(() => runRefresh())

  // Coming back to this page (or to the app) with data older than 5 minutes refreshes right away
  const refreshIfStale = useEffectEvent(() => {
    if (Date.now() - nightscout.fetchedAt >= REFRESH_MS) runRefresh()
  })

  useEffect(() => {
    const first = setTimeout(refreshIfStale, 0)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshIfStale()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(first)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Auto-refresh every 5 minutes while this page is open
  useEffect(() => {
    const id = setInterval(onTimer, REFRESH_MS)
    return () => {
      clearInterval(id)
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [])

  const controls = (
    <Card className="live-bar" aria-label="Live updates">
      <div className="live-bar__row">
        <div className="live-bar__text" aria-live="polite">
          <p className="live-bar__updated">
            {refresh.busy ? 'Refreshing…' : `Last updated ${formatClock(new Date(nightscout.fetchedAt))}`}
          </p>
          <p className="live-bar__hint">Checks for new readings every 5 minutes while this page is open.</p>
        </div>
        <Button variant="secondary" size="sm" icon="refresh" onClick={runRefresh} disabled={refresh.busy}>
          Refresh
        </Button>
      </div>
      {refresh.error && <InlineError error={refresh.error} />}
    </Card>
  )

  return (
    <DashboardView
      title="Live from Nightscout"
      back={{ to: '/nightscout', label: 'Nightscout' }}
      name={null}
      timeline={analysis}
      index={index}
      replay={null}
      controls={controls}
      loadExplanation={(i) => Promise.resolve(analysisExplanation(analysis, i))}
      hasExplanation={(i) => analysisExplanation(analysis, i) !== null}
    />
  )
}
