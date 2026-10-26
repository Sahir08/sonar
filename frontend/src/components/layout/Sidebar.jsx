import { Link, NavLink } from 'react-router-dom'
import { APP_NAME } from '../../constants.js'
import { SOURCE_TABS } from '../../lib/sources.js'
import Icon from '../ui/Icon.jsx'
import Logo from '../ui/Logo.jsx'
import './Sidebar.css'

const MORE = [
  { to: '/performance', label: 'Model performance', icon: 'gauge' },
  { to: '/about', label: 'About', icon: 'info' },
]

/**
 * Desktop sidebar (900px and up), same items as the tab bar: Home, Today, Patterns, Report, Settings.
 * Before any data source is open, Today/Patterns/Report ask for one first (onChoose(tab)).
 * Model performance and About sit in a quieter group at the bottom.
 */
export default function Sidebar({ links, onChoose }) {
  const navItem = (to, icon, label, end) => (
    <li key={label}>
      <NavLink to={to} end={end} className="sidebar__item">
        <Icon name={icon} size={22} />
        <span>{label}</span>
      </NavLink>
    </li>
  )

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar__brand">
        <Logo size={30} />
        <span>{APP_NAME}</span>
      </Link>
      <nav aria-label="Main">
        <ul className="sidebar__list">
          {navItem('/', 'home', 'Home', true)}
          {SOURCE_TABS.map((t) =>
            links ? (
              navItem(links[t.tab], t.icon, t.label, t.end)
            ) : (
              <li key={t.label}>
                <button
                  type="button"
                  className="sidebar__item"
                  aria-haspopup="dialog"
                  onClick={() => onChoose(t.tab)}
                >
                  <Icon name={t.icon} size={22} />
                  <span>{t.label}</span>
                </button>
              </li>
            ),
          )}
          {navItem('/settings', 'settings', 'Settings')}
        </ul>
      </nav>
      <nav aria-label="More" className="sidebar__more">
        <ul className="sidebar__list">
          {MORE.map((item) => (
            <li key={item.label}>
              <NavLink to={item.to} className="sidebar__item sidebar__item--quiet">
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
