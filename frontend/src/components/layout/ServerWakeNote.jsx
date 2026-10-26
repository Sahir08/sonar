import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { isServerWaking, subscribeServerWaking } from '../../api.js'
import { fade } from '../../lib/motion.js'
import Icon from '../ui/Icon.jsx'
import './ServerWakeNote.css'

/** Small floating note while the hosted server wakes from sleep (a request has waited over 5 seconds). */
export default function ServerWakeNote() {
  const waking = useSyncExternalStore(subscribeServerWaking, isServerWaking)
  return createPortal(
    <div className="wake-note-layer" role="status" aria-live="polite">
      <AnimatePresence>
        {waking && (
          <motion.p
            className="wake-note"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={fade}
          >
            <Icon name="clock" size={18} />
            <span>
              Waking up the server… <span className="wake-note__sub">This can take up to a minute.</span>
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
