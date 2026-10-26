import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { EASE_OUT } from '../../lib/motion.js'

/** A number that tweens to new values. Shows "—" for missing values. */
export default function AnimatedNumber({ value, decimals = 0, className }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className={className}>—</span>
  }
  return <Tween key={decimals} value={value} decimals={decimals} className={className} />
}

function Tween({ value, decimals, className }) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => v.toFixed(decimals))

  useEffect(() => {
    if (reduce) {
      mv.jump(value)
      return undefined
    }
    const controls = animate(mv, value, { duration: 0.35, ease: EASE_OUT })
    return () => controls.stop()
  }, [value, reduce, mv])

  return <motion.span className={className}>{text}</motion.span>
}
