import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import './styles/print.css'
import { wakeServer } from './api.js'
import App from './App.jsx'
import ErrorBoundary from './components/layout/ErrorBoundary.jsx'

// The hosted server sleeps when idle: start waking it now, and again when the user returns to the app
wakeServer()
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') wakeServer()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
