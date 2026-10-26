import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { InfoNote, PrivacyNote } from '../components/ui/Notices.jsx'
import Page from '../components/ui/Page.jsx'
import { InlineError } from '../components/ui/StateMessage.jsx'
import { useSession } from '../context/session.js'
import { NIGHTSCOUT_SOURCE, sourceLinks } from '../lib/sources.js'
import './Nightscout.css'

export default function Nightscout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { nightscout, setNightscout, clearNightscout } = useSession()
  const urlId = useId()
  const tokenId = useId()
  const helpId = useId()
  const controllerRef = useRef(null)
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [state, setState] = useState({ status: 'idle', error: null, message: null })
  const busy = state.status === 'connecting'

  useEffect(() => () => controllerRef.current?.abort(), [])

  async function connect(e) {
    e.preventDefault()
    if (busy) return
    const address = url.trim()
    if (!address) {
      setState({ status: 'error', error: null, message: 'Enter your Nightscout address.' })
      return
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setState({ status: 'connecting', error: null, message: null })
    try {
      const creds = { url: address, token: token.trim() }
      const analysis = await api.nightscout(creds, controller.signal)
      // Address and token stay in memory only, for refreshing
      setNightscout({ analysis, ...creds, fetchedAt: Date.now() })
      // Opened from a tab before any data was chosen: go to that tab
      navigate(sourceLinks(NIGHTSCOUT_SOURCE)[location.state?.nextTab] ?? '/nightscout/live')
    } catch (error) {
      if (error.kind === 'aborted') return
      setState({ status: 'error', error, message: null })
    }
  }

  return (
    <Page title="Connect Nightscout" back={{ to: '/', label: 'Home' }}>
      <p className="ns__intro">Sonar reads the last 3 days from your Nightscout site and keeps checking while this page is open.</p>

      {location.state?.dataGone && !nightscout && !busy && (
        <InfoNote>
          Your Nightscout connection isn't kept after the app closes or reloads. Connect again to continue.
        </InfoNote>
      )}

      {nightscout && !busy && (
        <Card size="sm" className="ns__open">
          <div>
            <p className="ns__open-title">Connected</p>
            <p className="ns__open-meta">Your live dashboard is ready.</p>
          </div>
          <div className="ns__open-actions">
            <Button variant="primary" size="sm" to="/nightscout/live">
              Open live dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={clearNightscout}>
              Disconnect
            </Button>
          </div>
        </Card>
      )}

      <Card as="form" className="ns__form" onSubmit={connect} noValidate>
        <div className="field">
          <label htmlFor={urlId} className="field__label">
            Nightscout address
          </label>
          <input
            id={urlId}
            className="field__input"
            type="url"
            inputMode="url"
            placeholder="https://yoursite.example.com"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="field">
          <label htmlFor={tokenId} className="field__label">
            Read token (optional)
          </label>
          <input
            id={tokenId}
            className="field__input"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={helpId}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={busy}
          />
          <p id={helpId} className="field__help">
            Only needed if your site requires one.
          </p>
        </div>
        {state.status === 'error' && <InlineError error={state.error}>{state.message}</InlineError>}
        <Button type="submit" variant="primary" size="lg" disabled={busy} aria-busy={busy}>
          {busy ? 'Connecting…' : 'Connect'}
        </Button>
      </Card>

      <PrivacyNote />
    </Page>
  )
}
