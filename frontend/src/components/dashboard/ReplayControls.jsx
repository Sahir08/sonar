import { SPEEDS } from '../../hooks/useReplay.js'
import Card from '../ui/Card.jsx'
import Icon from '../ui/Icon.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import './ReplayControls.css'

const SPEED_OPTIONS = SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }))

/** Play/pause, a scrubber across the whole dataset, and speed. */
export default function ReplayControls({ replay, timeLabel }) {
  const { index, last, playing, toggle, seek, speed, setSpeed } = replay
  const pct = last ? (index / last) * 100 : 0
  return (
    <Card className="replay" aria-label="Replay">
      <div className="replay__row">
        <button
          type="button"
          className="replay__play"
          onClick={toggle}
          aria-label={playing ? 'Pause replay' : 'Play replay'}
        >
          <Icon name={playing ? 'pause' : 'play'} size={20} />
        </button>
        <input
          type="range"
          className="replay__scrubber"
          min={0}
          max={last}
          step={1}
          value={index}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Replay position"
          aria-valuetext={timeLabel}
          style={{ '--pct': `${pct}%` }}
        />
      </div>
      <div className="replay__row replay__row--meta">
        <span className="replay__time tabular">{timeLabel}</span>
        <SegmentedControl
          legend="Replay speed"
          hideLegend
          size="sm"
          options={SPEED_OPTIONS}
          value={String(speed)}
          onChange={(v) => setSpeed(Number(v))}
        />
      </div>
    </Card>
  )
}
