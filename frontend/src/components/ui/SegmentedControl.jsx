import { useId } from 'react'
import './SegmentedControl.css'

/**
 * Accessible single choice built on native radio inputs. options: [{ value, label }]
 * hideLegend keeps the legend for screen readers only. size: "md" | "sm".
 */
export default function SegmentedControl({
  legend,
  options,
  value,
  onChange,
  description,
  hideLegend = false,
  size = 'md',
}) {
  const name = useId()
  return (
    <fieldset className={`segmented segmented--${size}`}>
      <legend className={hideLegend ? 'visually-hidden' : 'segmented__legend'}>{legend}</legend>
      {description && <p className="segmented__description">{description}</p>}
      <div className="segmented__track">
        {options.map((opt) => (
          <label key={opt.value} className={`segmented__option ${value === opt.value ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
