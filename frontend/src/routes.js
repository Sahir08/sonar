// Code for each screen, loaded on demand so the first page stays small.
// After the first render, preloadRoutes() fetches the rest in the background so later visits are instant.
import { createElement, lazy, useState } from 'react'

/**
 * A code-split screen that renders directly once its code has loaded.
 * Plain React.lazy() suspends on first render even when the code is already downloaded, and React then
 * keeps the loading placeholder up for about 300ms. This avoids that after preloading.
 * The choice is made once per mount, so a screen never switches component type (which would reset it).
 */
function lazyScreen(load) {
  let Loaded = null
  const remember = (module) => {
    Loaded = module.default
    return module
  }
  const LazyScreen = lazy(() => load().then(remember))

  function Screen(props) {
    const [Component] = useState(() => Loaded ?? LazyScreen)
    return createElement(Component, props)
  }
  Screen.preload = () => load().then(remember)
  return Screen
}

export const screens = {
  About: lazyScreen(() => import('./screens/About.jsx')),
  DemoDashboard: lazyScreen(() => import('./screens/DemoDashboard.jsx')),
  LiveDashboard: lazyScreen(() => import('./screens/LiveDashboard.jsx')),
  Nightscout: lazyScreen(() => import('./screens/Nightscout.jsx')),
  NotFound: lazyScreen(() => import('./screens/NotFound.jsx')),
  Overview: lazyScreen(() => import('./screens/Overview.jsx')),
  PatientPicker: lazyScreen(() => import('./screens/PatientPicker.jsx')),
  Patterns: lazyScreen(() => import('./screens/Patterns.jsx')),
  Performance: lazyScreen(() => import('./screens/Performance.jsx')),
  Report: lazyScreen(() => import('./screens/Report.jsx')),
  Settings: lazyScreen(() => import('./screens/Settings.jsx')),
  Upload: lazyScreen(() => import('./screens/Upload.jsx')),
  UploadDashboard: lazyScreen(() => import('./screens/UploadDashboard.jsx')),
}

let preloaded = false

/** Load every screen's code once, in the background. */
export function preloadRoutes() {
  if (preloaded) return
  preloaded = true
  Object.values(screens).forEach((screen) => screen.preload().catch(() => {}))
}
