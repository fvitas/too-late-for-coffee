import { render } from 'preact'
import '@fontsource/jetbrains-mono/latin-400.css'
import '../index.css'
import { A11yPlayground } from './A11yPlayground'

const root = document.getElementById('root')
if (root) render(<A11yPlayground />, root)
