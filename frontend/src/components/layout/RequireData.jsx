import { Navigate } from 'react-router-dom'
import { useSession } from '../../context/session.js'

const START = { upload: '/upload', nightscout: '/nightscout' }

/**
 * Upload/Nightscout routes without data in memory go back to their start screen,
 * which then explains that the data isn't kept after the app closes or reloads.
 */
export default function RequireData({ kind, children }) {
  const session = useSession()
  if (!session[kind]?.analysis) return <Navigate to={START[kind]} replace state={{ dataGone: true }} />
  return children
}
