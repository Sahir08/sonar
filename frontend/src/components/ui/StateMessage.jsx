import { errorMessage } from '../../api.js'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import './StateMessage.css'

/** Error state with the API's message and a Retry button. */
export function ErrorState({ error, onRetry, title }) {
  return (
    <div className="state-message" role="alert">
      <span className="state-message__icon">
        <Icon name="info" size={22} />
      </span>
      <p className="state-message__title">{title ?? errorMessage(error)}</p>
      {title && error && <p className="state-message__body">{errorMessage(error)}</p>}
      {onRetry && (
        <Button variant="secondary" icon="refresh" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

/** Compact error line for forms. */
export function InlineError({ error, children }) {
  return (
    <p className="inline-error" role="alert">
      <Icon name="info" size={18} />
      <span>{children ?? errorMessage(error)}</span>
    </p>
  )
}

/** Empty state with optional action. */
export function EmptyState({ title, children, action }) {
  return (
    <div className="state-message">
      <p className="state-message__title">{title}</p>
      {children && <p className="state-message__body">{children}</p>}
      {action}
    </div>
  )
}
