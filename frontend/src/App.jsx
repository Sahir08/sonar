import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import AppShell from './components/layout/AppShell.jsx'
import RequireData from './components/layout/RequireData.jsx'
import SessionProvider from './context/SessionProvider.jsx'
import SettingsProvider from './context/SettingsProvider.jsx'
import { screens } from './routes.js'
import Home from './screens/Home.jsx'

// Screens load on demand so the first page is small; the rest preload when the browser is idle (AppShell)
const {
  About,
  DemoDashboard,
  LiveDashboard,
  Nightscout,
  NotFound,
  Overview,
  PatientPicker,
  Patterns,
  Performance,
  Report,
  Settings,
  Upload,
  UploadDashboard,
} = screens

const guard = (kind, element) => <RequireData kind={kind}>{element}</RequireData>

export default function App() {
  return (
    <SettingsProvider>
      <SessionProvider>
        {/* reducedMotion="user": with prefers-reduced-motion, movement is dropped and fades remain */}
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Home />} />

                <Route path="demo" element={<PatientPicker />} />
                <Route path="demo/overview" element={<Overview />} />
                <Route path="demo/:id" element={<DemoDashboard />} />
                <Route path="demo/:id/patterns" element={<Patterns source="demo" />} />
                <Route path="demo/:id/report" element={<Report source="demo" />} />

                <Route path="upload" element={<Upload />} />
                <Route path="upload/dashboard" element={guard('upload', <UploadDashboard />)} />
                <Route path="upload/patterns" element={guard('upload', <Patterns source="upload" />)} />
                <Route path="upload/report" element={guard('upload', <Report source="upload" />)} />

                <Route path="nightscout" element={<Nightscout />} />
                <Route path="nightscout/live" element={guard('nightscout', <LiveDashboard />)} />
                <Route path="nightscout/patterns" element={guard('nightscout', <Patterns source="nightscout" />)} />
                <Route path="nightscout/report" element={guard('nightscout', <Report source="nightscout" />)} />

                <Route path="performance" element={<Performance />} />
                <Route path="about" element={<About />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </MotionConfig>
      </SessionProvider>
    </SettingsProvider>
  )
}
