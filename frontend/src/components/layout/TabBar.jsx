import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { PRESS_SCALE } from '../../lib/motion.js'
import { SOURCE_TABS } from '../../lib/sources.js'
import Icon from '../ui/Icon.jsx'
import './TabBar.css'

const MotionNavLink = motion.create(NavLink)

/**
 * Mobile bottom tab bar (below 900px), always shown: Home, Today, Patterns, Report, Settings.
 * Before any data source is open, Today/Patterns/Report ask for one first (onChoose(tab)).
 */
export default function TabBar({ links, onChoose }) {
  const content = (icon, label) => (
    <>
      <Icon name={icon} size={24} />
      <span className="tabbar__label">{label}</span>
    </>
  )
  const link = (to, icon, label, end) => (
    <MotionNavLink key={label} to={to} end={end} className="tabbar__item" whileTap={{ scale: PRESS_SCALE }}>
      {content(icon, label)}
    </MotionNavLink>
  )

  return (
    <nav className="tabbar" aria-label="Main">
      {link('/', 'home', 'Home', true)}
      {SOURCE_TABS.map((t) =>
        links ? (
          link(links[t.tab], t.icon, t.label, t.end)
        ) : (
          <motion.button
            key={t.label}
            type="button"
            className="tabbar__item"
            aria-haspopup="dialog"
            whileTap={{ scale: PRESS_SCALE }}
            onClick={() => onChoose(t.tab)}
          >
            {content(t.icon, t.label)}
          </motion.button>
        ),
      )}
      {link('/settings', 'settings', 'Settings')}
    </nav>
  )
}
