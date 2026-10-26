import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react'
import { DESKTOP_QUERY, useMediaQuery } from '../../hooks/useMediaQuery.js'
import { fade, sheetSpring } from '../../lib/motion.js'
import Icon from './Icon.jsx'
import './BottomSheet.css'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Modal sheet. Springs up from the bottom on mobile (drag the handle down to close),
 * centered panel on desktop. Escape closes; focus is trapped and restored.
 */
export default function BottomSheet({ open, onClose, title, subtitle, children }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <SheetContent onClose={onClose} title={title} subtitle={subtitle}>
          {children}
        </SheetContent>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function SheetContent({ onClose, title, subtitle, children }) {
  const titleId = useId()
  const sheetRef = useRef(null)
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const reduce = useReducedMotion()
  const dragControls = useDragControls()

  // Move focus into the dialog on open; restore it on close
  useEffect(() => {
    const previous = document.activeElement
    sheetRef.current?.focus({ preventScroll: true })
    const root = document.documentElement
    const prevOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = prevOverflow
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
    }
  }, [])

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const items = [...(sheetRef.current?.querySelectorAll(FOCUSABLE) ?? [])]
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === sheetRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  let sheetMotion
  if (reduce) {
    sheetMotion = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: fade }
  } else if (desktop) {
    sheetMotion = {
      initial: { opacity: 0, y: 24 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 24 },
      transition: sheetSpring,
    }
  } else {
    sheetMotion = { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: sheetSpring }
  }

  const dragProps =
    !desktop && !reduce
      ? {
          drag: 'y',
          dragListener: false,
          dragControls,
          dragConstraints: { top: 0, bottom: 0 },
          dragElastic: { top: 0, bottom: 0.7 },
          onDragEnd: (_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 600) onClose()
          },
        }
      : {}

  return (
    <div className="sheet-root" onKeyDown={onKeyDown}>
      <motion.div
        className="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        {...sheetMotion}
        {...dragProps}
      >
        <div
          className="sheet__grab"
          onPointerDown={(e) => {
            if (!desktop && !e.target.closest('button')) dragControls.start(e)
          }}
        >
          <span className="sheet__handle" aria-hidden="true" />
          <header className="sheet__header">
            <div>
              <h2 id={titleId} className="sheet__title">
                {title}
              </h2>
              {subtitle && <p className="sheet__subtitle">{subtitle}</p>}
            </div>
            <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
              <Icon name="close" size={20} />
            </button>
          </header>
        </div>
        <div className="sheet__body">{children}</div>
      </motion.div>
    </div>
  )
}
