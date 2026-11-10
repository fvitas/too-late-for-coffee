import { useSyncExternalStore } from 'react'

const query = window.matchMedia('(prefers-color-scheme: light)')

function subscribe(onChange: () => void): () => void {
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

// The canvas cannot use CSS colour tokens, so it reads the colour scheme here and redraws when it changes.
export function usePrefersLight(): boolean {
  return useSyncExternalStore(subscribe, () => query.matches)
}
