import './Card.css'

/** Rounded surface card. size: "md" (24px radius) | "sm" (18px radius). */
export default function Card({ as: Tag = 'section', size = 'md', className = '', children, ...rest }) {
  return (
    <Tag className={`card card--${size} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
