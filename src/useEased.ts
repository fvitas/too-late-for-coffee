import { useEffect, useRef, useState } from 'preact/hooks'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

// Eases from the shown value to each new target, so a change that interrupts a running ease does not jump.
export function useEased(target: number, durationMs: number): number {
  const [value, setValue] = useState(target)
  const shown = useRef(target)
  shown.current = value

  useEffect(() => {
    const from = shown.current
    if (from === target || reducedMotion.matches) {
      setValue(target)
      return
    }
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now: number) {
      const progress = Math.min(1, (now - start) / durationMs)
      setValue(from + (target - from) * (1 - (1 - progress) ** 3))
      if (progress < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs])

  return value
}
