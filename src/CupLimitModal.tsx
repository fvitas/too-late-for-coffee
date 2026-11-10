import { useEffect, useRef } from 'preact/hooks'
import { MAX_CUPS } from './caffeine'

type CupLimitModalProps = { onClose: () => void }

export function CupLimitModal({ onClose }: CupLimitModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => dialogRef.current?.showModal(), [])

  // The content fills the dialog, so a click on the dialog itself lands on the backdrop.
  function handleClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cup-limit-title"
      aria-describedby="cup-limit-text"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-md border border-line bg-paper text-body shadow-lg shadow-shade backdrop:bg-black/40"
      onClose={onClose}
      onClick={handleClick}
    >
      <div className="flex flex-col gap-3 p-6">
        <h2 id="cup-limit-title" className="text-xl text-bright">
          {MAX_CUPS} CUPS. YOU CAN NOW HEAR COLORS.
        </h2>
        <p id="cup-limit-text" className="text-muted">
          THE BLUE ONES ARE COUNTING SHEEP OUT LOUD. GO TO SLEEP.
        </p>
        <button type="button" className="mt-2 cursor-pointer self-end py-2 text-accent transition-colors hover:text-bright" onClick={onClose}>
          OK, DECAF IT IS
        </button>
      </div>
    </dialog>
  )
}
