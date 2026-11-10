import { useRef } from 'react'

// iOS Safari sends no dblclick for touch, so two presses on the same key within this time count as a double press.
const DOUBLE_PRESS_MS = 350

// Records a press and returns true when it completes a double press on the same key.
export function useDoublePress(): (key: number, time: number) => boolean {
  const last = useRef<{ key: number; time: number } | null>(null)
  return (key, time) => {
    const double = last.current?.key === key && time - last.current.time < DOUBLE_PRESS_MS
    last.current = double ? null : { key, time }
    return double
  }
}
