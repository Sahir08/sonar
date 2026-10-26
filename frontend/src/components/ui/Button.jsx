import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import './Button.css'

/**
 * Button or link styled as a button.
 * variant: "primary" | "secondary" | "ghost"; pass `to` for an in-app link.
 */
export default function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  to,
  href,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const classes = `btn btn--${variant} btn--${size} ${children ? '' : 'btn--icon-only'} ${className}`
  const content = (
    <>
      {icon && <Icon name={icon} size={size === 'sm' ? 18 : 20} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 18 : 20} />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  )
}
