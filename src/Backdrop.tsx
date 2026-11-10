type BackdropProps = { label: string; onClose: () => void }

// Invisible full-screen layer under an open popover, so a click or tap outside closes it.
export function Backdrop({ label, onClose }: BackdropProps) {
  return <button type="button" aria-label={label} className="fixed inset-0 z-10 cursor-default" onClick={onClose} />
}
