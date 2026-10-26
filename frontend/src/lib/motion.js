// Shared motion presets: calm, 200-400ms, ease-out or critically damped springs (no bounce).
export const EASE_OUT = [0.22, 1, 0.36, 1]

export const DURATION = { fast: 0.2, base: 0.3, slow: 0.4 }

export const fade = { duration: DURATION.fast, ease: EASE_OUT }
export const smooth = { duration: DURATION.base, ease: EASE_OUT }
export const slow = { duration: DURATION.slow, ease: EASE_OUT }

// Damping ratio ~1: settles without overshoot
export const softSpring = { type: 'spring', stiffness: 260, damping: 32, mass: 1 }
export const sheetSpring = { type: 'spring', stiffness: 320, damping: 36, mass: 1 }

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: fade,
}

export const PRESS_SCALE = 0.96
export const STAGGER = 0.06

// Parent variants that stagger children by 60ms
export const staggerList = { hidden: {}, show: { transition: { staggerChildren: STAGGER } } }
