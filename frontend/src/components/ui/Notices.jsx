import { DISCLAIMER, PRIVACY_TEXT } from '../../constants.js'
import Icon from './Icon.jsx'
import './Notices.css'

/** The exact research-prototype disclaimer. */
export function Disclaimer({ className = '' }) {
  return <p className={`disclaimer ${className}`}>{DISCLAIMER}</p>
}

/** The exact privacy text for Upload and Nightscout screens. */
export function PrivacyNote({ className = '' }) {
  return (
    <p className={`privacy-note ${className}`}>
      <Icon name="info" size={18} />
      <span>{PRIVACY_TEXT}</span>
    </p>
  )
}

/** Short informational note with an icon (e.g. why the user was sent back to a start screen). */
export function InfoNote({ children, className = '' }) {
  return (
    <p className={`info-note ${className}`} role="status">
      <Icon name="info" size={18} />
      <span>{children}</span>
    </p>
  )
}
