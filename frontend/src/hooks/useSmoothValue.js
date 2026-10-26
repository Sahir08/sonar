import { useEffect, useState } from 'react'
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { EASE_OUT } from '../lib/motion.js'

/**
 * Follows `target` smoothly. Jumps instantly when the change is larger than `snapOver`
 * (e.g. scrubbing) or when the user prefers reduced motion.
 */
export function useSmoothValue(target, { duration = 0.3, ease = EASE_OUT, snapOver = Infinity } = {}) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(target)
  const [value, setValue] = useState(target)
  useMotionValueEvent(mv, 'change', setValue)

  useEffect(() => {
    if (target === null || target === undefined) return undefined
    if (reduce || Math.abs(target - mv.get()) > snapOver) {
      mv.jump(target)
      return undefined
    }
    const controls = animate(mv, target, { duration, ease })
    return () => controls.stop()
  }, [target, reduce, snapOver, duration, ease, mv])

  return value
}
