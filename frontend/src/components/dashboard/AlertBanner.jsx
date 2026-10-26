import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT, smooth } from '../../lib/motion.js'
import Icon from '../ui/Icon.jsx'
import './AlertBanner.css'

/**
 * "Low likely within the hour" banner. Floats over the page (never moves layout),
 * slides down once with a single ping ripple, then stays still.
 * Render inside AnimatePresence, in a portal (see AlertBannerLayer).
 */
export default function AlertBanner({ text, onOpen, onDismiss }) {
  const reduce = useReducedMotion()
  const motionProps = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: '-120%' },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '-120%' },
      }

  return (
    <div className="alert-banner-layer">
      <motion.div className="alert-banner" role="alert" {...motionProps} transition={smooth}>
        <button type="button" className="alert-banner__main" onClick={onOpen}>
          <span className="alert-banner__icon">
            {!reduce && (
              <motion.span
                className="alert-banner__ripple"
                aria-hidden="true"
                initial={{ scale: 0.7, opacity: 0.55 }}
                animate={{ scale: 2.1, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.2 }}
              />
            )}
            <Icon name="alert" size={22} />
          </span>
          <span className="alert-banner__text">
            <strong>{text}</strong>
            <span>Tap to see why</span>
          </span>
          <Icon name="chevronRight" size={20} className="alert-banner__chevron" />
        </button>
        <button type="button" className="alert-banner__dismiss" onClick={onDismiss} aria-label="Dismiss alert">
          <Icon name="close" size={18} />
        </button>
      </motion.div>
    </div>
  )
}
