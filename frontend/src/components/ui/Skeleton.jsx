import './Skeleton.css'

/** Soft shimmer placeholder while data loads. */
export default function Skeleton({ width = '100%', height = 16, radius, className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

/** Wrapper that announces loading to screen readers. */
export function LoadingRegion({ label = 'Loading', children, className = '' }) {
  return (
    <div className={className} role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  )
}
