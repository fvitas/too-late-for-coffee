import { useEffect, useRef, useState } from 'preact/hooks'
import { type Cup, type Settings } from './caffeine'
import { Popover } from './Popover'
import { toShareQuery } from './share'

type SharePanelProps = { cups: Cup[]; settings: Settings }

const COPIED_MS = 2_000

export function SharePanel({ cups, settings }: SharePanelProps) {
  return (
    <Popover label="SHARE" closeLabel="Close share">
      {(close) => <ShareLink url={`${window.location.origin}${window.location.pathname}${toShareQuery(cups, settings)}`} onCopied={close} />}
    </Popover>
  )
}

type ShareLinkProps = { url: string; onCopied: () => void }

function ShareLink({ url, onCopied }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(undefined)

  // A popover closed early must not let its timer close the next one.
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(onCopied, COPIED_MS)
    } catch {
      // The browser blocked the clipboard, so the user can still copy from the field.
    }
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    event.currentTarget.select()
  }

  return (
    <div className="flex w-[min(28rem,calc(100vw-4rem-2px))] items-center gap-3">
      <input
        readOnly
        value={url}
        aria-label="Share link"
        className="min-w-0 flex-1 rounded-md border border-line bg-transparent px-3 py-2 text-bright"
        onFocus={handleFocus}
      />
      <button type="button" className="w-[6ch] shrink-0 cursor-pointer py-2 text-accent transition-colors hover:text-bright" onClick={copy}>
        {copied ? 'COPIED' : 'COPY'}
      </button>
    </div>
  )
}
