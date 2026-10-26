import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { formatEffect } from '../../lib/explain.js'
import { smooth } from '../../lib/motion.js'
import Icon from '../ui/Icon.jsx'

const itemVariants = { hidden: {}, show: {} }
const barVariants = { hidden: { scaleX: 0 }, show: { scaleX: 1, transition: smooth } }

/** Expandable list of the model's contributions inside a group. */
function Details({ id, group, note }) {
  const reduce = useReducedMotion()
  const hidden = reduce ? { opacity: 0 } : { height: 0, opacity: 0 }
  return (
    <motion.div
      id={id}
      className="factor__details"
      initial={hidden}
      animate={{ height: 'auto', opacity: 1 }}
      exit={hidden}
      transition={smooth}
    >
      <div className="factor__details-inner">
        {note && <p className="factor__note">{note}</p>}
        <ul className="factor__detail-list">
          {(group.details ?? []).map((d) => (
            <li key={d.factor}>
              <span>
                {d.factor}
                {d.shared && <span className="factor__shared"> · shared</span>}
              </span>
              <span className="tabular">{formatEffect(d.effect)}</span>
            </li>
          ))}
        </ul>
        <p className="factor__caption">
          Effect on the model&apos;s score: positive raises risk, negative lowers it. Shared effects are split
          equally between groups.
        </p>
      </div>
    </motion.div>
  )
}

/** A group card: name, plain-language value, bar sized by |effect|; expands to show details. */
export function FactorCard({ group, value, subline, tone }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <motion.li className="factor" variants={itemVariants}>
      <button type="button" className="factor__button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span className="factor__top">
          <span className="factor__name">{group.group}</span>
          <span className="factor__value">{value}</span>
          <Icon name="chevronDown" size={16} className={`factor__chevron ${open ? 'is-open' : ''}`} />
        </span>
        <span className="factor__track" aria-hidden="true">
          <motion.span
            className="factor__fill"
            variants={barVariants}
            style={{ width: `${Math.max(group.scale * 100, 2)}%`, background: tone }}
          />
        </span>
        {subline && <span className="factor__sub">{subline}</span>}
      </button>
      <AnimatePresence initial={false}>{open && <Details id={id} group={group} />}</AnimatePresence>
    </motion.li>
  )
}

/** A small-effect group as a compact row; tappable for details. */
export function SmallFactorRow({ group, value }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const note = group.direction === 'lowers' ? 'Slightly lowers risk.' : 'Slightly increases risk.'
  return (
    <li className="small-factor">
      <button type="button" className="small-factor__button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span>{group.group}</span>
        <span className="small-factor__value">{value}</span>
        <Icon name="chevronDown" size={16} className={`factor__chevron ${open ? 'is-open' : ''}`} />
      </button>
      <AnimatePresence initial={false}>{open && <Details id={id} group={group} note={note} />}</AnimatePresence>
    </li>
  )
}
