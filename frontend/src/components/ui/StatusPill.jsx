import { statusInfo } from '../../lib/status.js'
import './StatusPill.css'

/** Status label with a colored dot. Color is always paired with the text label. */
export default function StatusPill({ status, size = 'md' }) {
  const info = statusInfo(status)
  return (
    <span className={`status-pill status-pill--${size}`} style={{ '--status': info.color, '--status-text': info.text, '--status-glow': info.glow }}>
      <span className="status-pill__dot" aria-hidden="true" />
      {info.label}
    </span>
  )
}
