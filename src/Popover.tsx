import { useState } from 'preact/hooks'
import { Backdrop } from './Backdrop'

type PopoverProps = { label: string; closeLabel: string; children: (close: () => void) => React.ReactNode }

// Only the open button sits above the backdrop, so a click on another button just closes this popover.
// The panel aligns to the nearest positioned parent, so all header popovers share one right edge.
export function Popover({ label, closeLabel, children }: PopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="shrink-0 text-sm sm:text-base">
      <button
        type="button"
        aria-expanded={open}
        className={`cursor-pointer py-2 text-base text-muted transition-colors hover:text-bright focus-visible:text-bright sm:text-xl ${open ? 'relative z-20' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      {open && <Backdrop label={closeLabel} onClose={() => setOpen(false)} />}
      {open && (
        <div className="absolute top-full right-0 z-20 mt-2 flex flex-col gap-2 rounded-md border border-line bg-paper p-4 text-muted shadow-lg shadow-shade">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
