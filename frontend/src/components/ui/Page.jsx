import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import './Page.css'

/** Top row: back link on the left, data-source pill on the right (same spot on every screen). */
export function PageTopBar({ back, switcher, className = '' }) {
  if (!back && !switcher) return null
  return (
    <div className={`page__topbar ${className}`}>
      {back ? (
        <Link className="page__back" to={back.to}>
          <Icon name="chevronLeft" size={20} />
          <span>{back.label}</span>
        </Link>
      ) : (
        <span />
      )}
      {switcher && <div className="page__switcher">{switcher}</div>}
    </div>
  )
}

/** Screen wrapper: optional back link and source switcher, eyebrow, large title, actions. */
export default function Page({ eyebrow, title, back, switcher, actions, children, className = '' }) {
  return (
    <div className={`page ${className}`}>
      <PageTopBar back={back} switcher={switcher} />
      <header className="page__header">
        <div className="page__heading">
          {eyebrow && <p className="page__eyebrow">{eyebrow}</p>}
          <h1 className="page__title">{title}</h1>
        </div>
        {actions && <div className="page__actions">{actions}</div>}
      </header>
      {children}
    </div>
  )
}
