import { useState } from 'preact/hooks'
import { App } from '../App'
import { DARK_PALETTE, LIGHT_PALETTE } from '../draw'

type Theme = 'light' | 'dark'
type Fix = { label: string; where: string; min: number; before: Record<Theme, string>; after: Record<Theme, string> }

const PAPER: Record<Theme, string> = { light: '#f5f5f4', dark: '#0e0e0e' }

const FIXES: Fix[] = [
  {
    label: 'MUTED TEXT',
    where: 'summary, settings labels, limit label, peak time',
    min: 4.5,
    before: { light: '#707070', dark: '#757575' },
    after: { light: '#707070', dark: '#808080' },
  },
  {
    label: 'ACCENT TEXT',
    where: 'selected cup time, COPY, picked drink',
    min: 4.5,
    before: { light: '#3b82f6', dark: '#3b82f6' },
    after: { light: '#2563eb', dark: '#3b82f6' },
  },
  {
    label: 'FAINT TEXT → MUTED',
    where: 'hour axis labels, 0-500 placeholder',
    min: 4.5,
    before: { light: '#c4c4c4', dark: '#3a3a3a' },
    after: { light: '#707070', dark: '#808080' },
  },
  {
    label: 'LIMIT LINE',
    where: 'dashed limit line, axis ticks, guides (canvas)',
    min: 3,
    before: { light: LIGHT_PALETTE.subtle, dark: DARK_PALETTE.subtle },
    after: { light: '#8a8a8a', dark: '#626262' },
  },
  {
    label: 'BED LINE',
    where: 'bedtime line (canvas)',
    min: 3,
    before: { light: LIGHT_PALETTE.bedLine, dark: DARK_PALETTE.bedLine },
    after: { light: '#767676', dark: DARK_PALETTE.bedLine },
  },
]

const NOTES = ['FOOTER TEXT 8PX → 11PX ON MOBILE', 'THEME TOGGLE TARGET 20×36 → 44×44 PX (WCAG 2.5.8 NEEDS 24)']

// The fix overrides the theme tokens and a few utilities, so the app code stays as it is.
const FIX_CSS = `
:root {
  --color-muted: light-dark(${FIXES[0].after.light}, ${FIXES[0].after.dark});
  --color-accent: light-dark(${FIXES[1].after.light}, ${FIXES[1].after.dark});
}
.text-faint, input::placeholder { color: var(--color-muted); }
footer { font-size: 11px; }
button[aria-label^="Switch to"] { min-width: 44px; min-height: 44px; justify-content: center; align-items: center; }
`

const ORIGINAL = { light: { ...LIGHT_PALETTE }, dark: { ...DARK_PALETTE } }

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255
    return channel <= 0.039_28 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground: string, background: string): number {
  const [high, low] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (high + 0.05) / (low + 0.05)
}

function setPalettes(fixed: boolean) {
  Object.assign(LIGHT_PALETTE, fixed ? { subtle: FIXES[3].after.light, bedLine: FIXES[4].after.light } : ORIGINAL.light)
  Object.assign(DARK_PALETTE, fixed ? { subtle: FIXES[3].after.dark, bedLine: FIXES[4].after.dark } : ORIGINAL.dark)
}

export function A11yPlayground() {
  const [fixed, setFixed] = useState(false)

  // The app renders again with this component, so the canvas redraws with the changed palette.
  function toggle() {
    setPalettes(!fixed)
    setFixed(!fixed)
  }

  return (
    <>
      {fixed && <style>{FIX_CSS}</style>}
      <App />
      <section className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 pb-32 font-['JetBrains_Mono',ui-monospace,monospace] text-sm text-body sm:px-8">
        <h2 className="text-bright">WCAG AA CONTRAST · {fixed ? 'FIX ON' : 'CURRENT'}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-4 font-normal">ELEMENT</th>
                <th className="py-2 pr-4 font-normal">NEEDS</th>
                <th className="py-2 pr-4 font-normal">LIGHT</th>
                <th className="py-2 font-normal">DARK</th>
              </tr>
            </thead>
            <tbody>
              {FIXES.map((fix) => (
                <tr key={fix.label} className="border-t border-line align-top">
                  <td className="py-2 pr-4">
                    <div className="text-bright">{fix.label}</div>
                    <div className="text-muted">{fix.where}</div>
                  </td>
                  <td className="py-2 pr-4">{fix.min}:1</td>
                  {(['light', 'dark'] as const).map((theme) => (
                    <td key={theme} className="py-2 pr-4 whitespace-nowrap">
                      <Ratio color={fix.before[theme]} background={PAPER[theme]} min={fix.min} dim={fixed} />
                      <span className="text-muted"> → </span>
                      <Ratio color={fix.after[theme]} background={PAPER[theme]} min={fix.min} dim={!fixed} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-col gap-1 text-muted">
          {NOTES.map((note) => (
            <li key={note}>+ {note}</li>
          ))}
        </ul>
      </section>
      <button
        type="button"
        className={`fixed right-4 bottom-4 z-50 cursor-pointer rounded-md border px-4 py-3 font-['JetBrains_Mono',ui-monospace,monospace] text-sm shadow-lg ${fixed ? 'border-accent bg-accent text-white' : 'border-line bg-paper text-bright'}`}
        onClick={toggle}
      >
        WCAG AA FIX: {fixed ? 'ON' : 'OFF'}
      </button>
    </>
  )
}

type RatioProps = { color: string; background: string; min: number; dim: boolean }

function Ratio({ color, background, min, dim }: RatioProps) {
  const ratio = contrast(color, background)
  const pass = ratio >= min
  return (
    <span className={dim ? 'opacity-40' : ''}>
      <span className="mr-1 inline-block size-3 rounded-sm align-middle" style={{ backgroundColor: color }} />
      {ratio.toFixed(2)} <span className={pass ? 'text-green-600' : 'text-red-500'}>{pass ? 'PASS' : 'FAIL'}</span>
    </span>
  )
}
