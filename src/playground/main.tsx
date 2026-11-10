import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/jetbrains-mono'
import '../index.css'
import { Playground } from './Playground'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Playground />
    </StrictMode>,
  )
}
