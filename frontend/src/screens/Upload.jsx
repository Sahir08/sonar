import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Icon from '../components/ui/Icon.jsx'
import { InfoNote, PrivacyNote } from '../components/ui/Notices.jsx'
import Page from '../components/ui/Page.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { InlineError } from '../components/ui/StateMessage.jsx'
import { useSession } from '../context/session.js'
import { UPLOAD_SOURCE, sourceLinks } from '../lib/sources.js'
import './Upload.css'

const FORMATS =
  'LibreView or Dexcom Clarity CSV exports, or any CSV with a time and a glucose column (mg/dL or mmol/L).'

const isCsv = (file) => /\.csv$/i.test(file.name) || file.type === 'text/csv'

export default function Upload() {
  const navigate = useNavigate()
  const location = useLocation()
  const { upload, setUpload, clearUpload } = useSession()
  const inputRef = useRef(null)
  const controllerRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [state, setState] = useState({ status: 'idle', fileName: null, error: null })
  const busy = state.status === 'uploading'

  useEffect(() => () => controllerRef.current?.abort(), [])

  async function send(file) {
    if (!file || busy) return
    if (!isCsv(file)) {
      setState({ status: 'error', fileName: file.name, error: null, message: 'Please choose a .csv file.' })
      return
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setState({ status: 'uploading', fileName: file.name, error: null })
    try {
      const analysis = await api.upload(file, controller.signal)
      setUpload({ analysis, fileName: file.name })
      // Opened from a tab before any data was chosen: go to that tab
      navigate(sourceLinks(UPLOAD_SOURCE)[location.state?.nextTab] ?? '/upload/dashboard')
    } catch (error) {
      if (error.kind === 'aborted') return
      setState({ status: 'error', fileName: file.name, error })
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    send(e.dataTransfer.files?.[0])
  }

  return (
    <Page title="Upload your data" back={{ to: '/', label: 'Home' }}>
      <p className="upload__intro">See Sonar's warnings on your own CGM history. Replay it like the demo.</p>

      {location.state?.dataGone && !upload && !busy && (
        <InfoNote>Your uploaded data isn't kept after the app closes or reloads. Upload your file again to continue.</InfoNote>
      )}

      {upload && !busy && (
        <Card size="sm" className="upload__open">
          <div>
            <p className="upload__open-title">Your data is open</p>
            <p className="upload__open-meta">
              {upload.fileName} · {upload.analysis.patterns?.days ?? '—'} days
            </p>
          </div>
          <div className="upload__open-actions">
            <Button variant="primary" size="sm" to="/upload/dashboard">
              Open dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={clearUpload}>
              Remove
            </Button>
          </div>
        </Card>
      )}

      <div
        className={`dropzone ${dragging ? 'is-dragging' : ''} ${busy ? 'is-busy' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {busy ? (
          <div className="dropzone__busy" role="status" aria-live="polite">
            <p className="dropzone__title">Analyzing {state.fileName}…</p>
            <p className="dropzone__hint">This can take a few seconds.</p>
            <Skeleton height={8} radius={999} style={{ width: '70%', marginTop: 8 }} />
          </div>
        ) : (
          <>
            <span className="dropzone__icon">
              <Icon name="upload" size={26} />
            </span>
            <p className="dropzone__title">Drop your CSV file here</p>
            <p className="dropzone__hint">or</p>
            <Button variant="primary" onClick={() => inputRef.current?.click()}>
              Choose file
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            send(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {state.status === 'error' && (
        <InlineError error={state.error}>{state.message}</InlineError>
      )}

      <p className="upload__formats">{FORMATS}</p>
      <PrivacyNote />
    </Page>
  )
}
