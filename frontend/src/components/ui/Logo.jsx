import { useId } from 'react'

// Sonar logo: a radar sweep. A quarter-circle wedge pivots from a point, with a bright
// leading edge on the right and a soft trail fading behind it, plus one blip.
const PIVOT = { x: 24, y: 37 }
const R = 29
const D = R * Math.SQRT1_2 // 45-degree offset
const LEFT = { x: PIVOT.x - D, y: PIVOT.y - D }
const RIGHT = { x: PIVOT.x + D, y: PIVOT.y - D }
const WEDGE = `M${PIVOT.x} ${PIVOT.y} L${LEFT.x} ${LEFT.y} A${R} ${R} 0 0 1 ${RIGHT.x} ${RIGHT.y} Z`

export default function Logo({ size = 32, title, className }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const trail = `sonar-trail-${id}`
  const edge = `sonar-edge-${id}`
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={trail} gradientUnits="userSpaceOnUse" x1={LEFT.x} y1="0" x2={RIGHT.x} y2="0">
          <stop offset="0" style={{ stopColor: 'var(--accent-a)', stopOpacity: 0 }} />
          <stop offset="0.45" style={{ stopColor: 'var(--accent-a)', stopOpacity: 0.16 }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-b)', stopOpacity: 0.75 }} />
        </linearGradient>
        <linearGradient id={edge} gradientUnits="userSpaceOnUse" x1={PIVOT.x} y1={PIVOT.y} x2={RIGHT.x} y2={RIGHT.y}>
          <stop offset="0" style={{ stopColor: 'var(--accent-a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent-b)' }} />
        </linearGradient>
      </defs>
      <path d={WEDGE} fill={`url(#${trail})`} />
      <path
        d={`M${PIVOT.x} ${PIVOT.y} L${RIGHT.x} ${RIGHT.y}`}
        stroke={`url(#${edge})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={PIVOT.x} cy={PIVOT.y} r="3" style={{ fill: 'var(--accent-a)' }} />
      <circle cx="16" cy="19" r="2.5" style={{ fill: 'var(--accent-a)' }} />
    </svg>
  )
}
