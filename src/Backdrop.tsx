import { useEffect } from 'react'

type BackdropProps = { label: string; onClose: () => void }

// Invisible full-screen layer under an open popover, so a click or tap outside closes it.
export function Backdrop({ label, onClose }: BackdropProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return <button type="button" tabIndex={-1} aria-label={label} className="fixed inset-0 z-10 cursor-default" onClick={onClose} />
}
