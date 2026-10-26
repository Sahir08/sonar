import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useSession } from '../../context/session.js'
import { pageTransition } from '../../lib/motion.js'
import { prefetchDemoPatient, prefetchPatients, saveData, whenIdle } from '../../lib/prefetch.js'
import { sameSource, sourceFromPath, sourceLinks } from '../../lib/sources.js'
import { preloadRoutes } from '../../routes.js'
import Skeleton, { LoadingRegion } from '../ui/Skeleton.jsx'
import ServerWakeNote from './ServerWakeNote.jsx'
import { SourceSheet } from './SourceSwitcher.jsx'
import Sidebar from './Sidebar.jsx'
import TabBar from './TabBar.jsx'
import './AppShell.css'

/** Shown while a screen's code loads. */
function PageSkeleton() {
  return (
    <LoadingRegion label="Loading" className="page">
      <Skeleton width={200} height={34} />
      <Skeleton height={180} radius={24} />
      <Skeleton height={120} radius={24} />
    </LoadingRegion>
  )
}

export default function AppShell() {
  const { pathname } = useLocation()

  // Remember the last opened data source (in memory) so its tabs keep working from other screens.
  // Upload and Nightscout only count while their data is in memory.
  const session = useSession()
  const isOpen = (s) => !!s && (s.kind === 'demo' || !!session[s.kind]?.analysis)
  const fromPath = sourceFromPath(pathname)
  const current = isOpen(fromPath) ? fromPath : null
  const [lastSource, setLastSource] = useState(current)
  if (current && !sameSource(current, lastSource)) setLastSource(current)
  const openSource = current ?? (isOpen(lastSource) ? lastSource : null)
  const links = sourceLinks(openSource)

  // Today/Patterns/Report tapped before any source is open: ask for one, then open that tab
  const [chooser, setChooser] = useState({ open: false, tab: 'today' })
  const choose = (tab) => setChooser({ open: true, tab })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // After the first render, load every screen's code in the background
  useEffect(() => (saveData() ? undefined : whenIdle(preloadRoutes)), [])

  // Home: the demo patient list is the most likely next step
  const onHome = pathname === '/'
  useEffect(() => (onHome && !saveData() ? whenIdle(prefetchPatients) : undefined), [onHome])

  // An open demo patient: load its Today, Patterns and Report data so tab switches are instant.
  // Upload and Nightscout responses already include patterns and report.
  const demoId = openSource?.kind === 'demo' ? openSource.id : null
  useEffect(() => (demoId && !saveData() ? whenIdle(() => prefetchDemoPatient(demoId)) : undefined), [demoId])

  return (
    <div className="app app--has-tabs">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Sidebar links={links} onChoose={choose} />
      <main id="main" className="app__main" tabIndex={-1}>
        <motion.div key={pathname} className="app__content" {...pageTransition}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </motion.div>
      </main>
      <TabBar links={links} onChoose={choose} />
      <ServerWakeNote />
      <SourceSheet
        open={chooser.open}
        tab={chooser.tab}
        onClose={() => setChooser((c) => ({ ...c, open: false }))}
      />
    </div>
  )
}
