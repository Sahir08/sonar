import { useCallback, useEffect, useState } from 'react'
import { recallIndex, rememberIndex } from '../lib/replayMemory.js'

export const SPEEDS = [1, 4, 16]

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

/**
 * Replay clock: 1x = one reading per second. Starts paused.
 * startIndex: the replay's start point (play at the end restarts here).
 * initialIndex: where to open, if requested (e.g. from the overview or a day link).
 * memoryKey: remembers the position in memory, so leaving and coming back keeps the moment.
 * Opening order: initialIndex, then the remembered position, then startIndex.
 */
export function useReplay(length, startIndex, { initialIndex = null, memoryKey = null } = {}) {
  const last = Math.max(0, length - 1)
  const start = clamp(startIndex, 0, last)
  const [index, setIndex] = useState(() => clamp(initialIndex ?? recallIndex(memoryKey) ?? start, 0, last))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const atEnd = index >= last
  // Stop when the end of the data is reached
  if (playing && atEnd) setPlaying(false)

  useEffect(() => {
    rememberIndex(memoryKey, index)
  }, [memoryKey, index])

  useEffect(() => {
    if (!playing || atEnd) return undefined
    const id = setInterval(() => setIndex((i) => Math.min(i + 1, last)), 1000 / speed)
    return () => clearInterval(id)
  }, [playing, atEnd, speed, last])

  const seek = useCallback((i) => setIndex(clamp(Math.round(i), 0, last)), [last])

  const toggle = useCallback(() => {
    if (atEnd) {
      setIndex(start)
      setPlaying(true)
    } else {
      setPlaying((p) => !p)
    }
  }, [atEnd, start])

  const pause = useCallback(() => setPlaying(false), [])

  return { index, playing: playing && !atEnd, speed, setSpeed, toggle, pause, seek, last }
}
