import { Component } from 'react'
import { APP_NAME } from '../../constants.js'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'
import './ErrorBoundary.css'

/**
 * Top-level safety net: if any component crashes while rendering, show a friendly screen
 * with a Reload button instead of a blank page. Needs no router, context or data, so it
 * still works when those are what failed.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Kept in the console for debugging; no health data is involved
    console.error(`${APP_NAME} crashed:`, error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="crash" role="alert">
        <div className="crash__card">
          <span className="crash__icon">
            <Icon name="info" size={24} />
          </span>
          <h1 className="crash__title">Something went wrong</h1>
          <p className="crash__body">
            {APP_NAME} hit an unexpected problem and couldn&apos;t show this screen. Reloading usually fixes it.
          </p>
          <Button variant="primary" icon="refresh" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </main>
    )
  }
}
