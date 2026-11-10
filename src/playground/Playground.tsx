import { useState } from 'preact/hooks'
import { type DrinkIconName, DRINKS } from '../caffeine'
import { DotIcon } from './DotIcon'
import { type Concept, type DotShape, type DotStyle, type IconGroup, type Mode, ICON_GROUPS, dotsFor } from './dotIcons'

type Option<T> = { value: T; label: string }

const GRIDS = [6, 7, 8, 10, 12, 16]
const MODES: Option<Mode>[] = [
  { value: 'solid', label: 'SOLID' },
  { value: 'halftone', label: 'HALFTONE' },
  { value: 'fade', label: 'FADE' },
  { value: 'outline', label: 'OUTLINE' },
  { value: 'chart', label: 'CHART' },
]
const SHAPES: Option<DotShape>[] = [
  { value: 'circle', label: 'CIRCLE' },
  { value: 'square', label: 'SQUARE' },
  { value: 'rounded', label: 'ROUNDED' },
]
const SIZES = [0.5, 0.65, 0.75, 0.9, 1]
const PREVIEW_PX = [16, 20, 24, 32]
const DEFAULT_STYLE: DotStyle = { grid: 8, mode: 'solid', shape: 'circle', size: 0.75, lattice: false }
const DEFAULT_PICKS: Record<DrinkIconName, string> = {
  espresso: 'A',
  'pour-over': 'A',
  matcha: 'A',
  tea: 'B',
  'caffeine-pill': 'A',
  cup: 'A',
}
const CONTEXT_CUPS: { time: string; icon: DrinkIconName }[] = [
  { time: '08:00', icon: 'espresso' },
  { time: '11:00', icon: 'pour-over' },
  { time: '13:30', icon: 'matcha' },
  { time: '15:30', icon: 'tea' },
  { time: '17:00', icon: 'caffeine-pill' },
  { time: '19:00', icon: 'cup' },
]

export function Playground() {
  const [style, setStyle] = useState<DotStyle>(DEFAULT_STYLE)
  const [picks, setPicks] = useState(DEFAULT_PICKS)
  const [focus, setFocus] = useState<DrinkIconName>('espresso')
  const [copied, setCopied] = useState(false)

  const conceptOf = (group: IconGroup) => group.concepts.find((concept) => concept.id === picks[group.icon]) ?? group.concepts[0]
  const pickedConcept = (icon: DrinkIconName) => conceptOf(groupOf(icon))
  const focusGroup = groupOf(focus)
  const focusConcept = conceptOf(focusGroup)
  const update = (change: Partial<DotStyle>) => setStyle((current) => ({ ...current, ...change }))
  const summary = [
    ICON_GROUPS.map((group) => `${group.name} ${picks[group.icon]}`).join(' · '),
    `GRID ${style.grid} · ${style.mode.toUpperCase()} · ${style.shape.toUpperCase()} · ${Math.round(style.size * 100)}% · LATTICE ${style.lattice ? 'ON' : 'OFF'}`,
  ].join('\n')

  function pick(icon: DrinkIconName, conceptId: string) {
    setPicks((current) => ({ ...current, [icon]: conceptId }))
    setFocus(icon)
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary)
    setCopied(true)
  }

  return (
    <main className="min-h-dvh bg-[#0e0e0e] px-4 py-6 font-['JetBrains_Mono',ui-monospace,monospace] text-sm text-[#dcdcdc] sm:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-[22px] text-[#f7f7f7]">ICON PLAYGROUND</h1>
          <p className="text-[#757575]">Pick a concept per drink, then tune the dot style. Every view updates live.</p>
        </header>

        <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 border-b border-[#1f1f1f] bg-[#0e0e0e] px-4 py-3 sm:-mx-8 sm:px-8">
          <Segmented
            label="GRID"
            options={GRIDS.map((grid) => ({ value: grid, label: `${grid}×${grid}` }))}
            value={style.grid}
            onChange={(grid) => update({ grid })}
          />
          <Segmented label="MODE" options={MODES} value={style.mode} onChange={(mode) => update({ mode })} />
          <Segmented label="DOT" options={SHAPES} value={style.shape} onChange={(shape) => update({ shape })} />
          <Segmented
            label="SIZE"
            options={SIZES.map((size) => ({ value: size, label: `${Math.round(size * 100)}%` }))}
            value={style.size}
            onChange={(size) => update({ size })}
          />
          <Segmented
            label="LATTICE"
            options={[
              { value: false, label: 'OFF' },
              { value: true, label: 'ON' },
            ]}
            value={style.lattice}
            onChange={(lattice) => update({ lattice })}
          />
        </div>

        <Section title="1 · CONCEPTS" hint="Click a tile to pick it for that drink.">
          <div className="flex flex-col gap-6">
            {ICON_GROUPS.map((group) => (
              <div key={group.icon} className="flex flex-col gap-2">
                <span className={focus === group.icon ? 'text-[#3b82f6]' : 'text-[#757575]'}>{group.name}</span>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {group.concepts.map((concept) => (
                    <ConceptTile
                      key={concept.id}
                      group={group}
                      concept={concept}
                      style={style}
                      picked={picks[group.icon] === concept.id}
                      onPick={() => pick(group.icon, concept.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={`2 · MODE × GRID — ${focusGroup.name} ${focusConcept.id}`} hint="Click a cell to use that mode and grid.">
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-2">
              <thead>
                <tr>
                  <th />
                  {GRIDS.map((grid) => (
                    <th key={grid} className="font-normal text-[#757575]">
                      {grid}×{grid}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODES.map((mode) => (
                  <tr key={mode.value}>
                    <th className="pr-2 text-left font-normal text-[#757575]">{mode.label}</th>
                    {GRIDS.map((grid) => (
                      <td key={grid}>
                        <MatrixCell
                          group={focusGroup}
                          concept={focusConcept}
                          style={{ ...style, mode: mode.value, grid }}
                          active={style.mode === mode.value && style.grid === grid}
                          onPick={() => update({ mode: mode.value, grid })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title={`3 · DOT × SIZE — ${focusGroup.name} ${focusConcept.id}`} hint="Click a cell to use that dot shape and size.">
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-2">
              <thead>
                <tr>
                  <th />
                  {SIZES.map((size) => (
                    <th key={size} className="font-normal text-[#757575]">
                      {Math.round(size * 100)}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SHAPES.map((shape) => (
                  <tr key={shape.value}>
                    <th className="pr-2 text-left font-normal text-[#757575]">{shape.label}</th>
                    {SIZES.map((size) => (
                      <td key={size}>
                        <MatrixCell
                          group={focusGroup}
                          concept={focusConcept}
                          style={{ ...style, shape: shape.value, size }}
                          active={style.shape === shape.value && style.size === size}
                          onPick={() => update({ shape: shape.value, size })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4 · IN CONTEXT" hint="Your picks at the real sizes: 16 px under the cup times, 20 px in the drink chips.">
          <div className="flex flex-col gap-6 border border-[#1f1f1f] p-4">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {CONTEXT_CUPS.map((cup, index) => (
                <div key={cup.time} className={`flex flex-col items-center gap-1 ${index === 3 ? 'text-[#3b82f6]' : 'text-[#757575]'}`}>
                  <span className={`size-3.5 rounded-full ${index === 3 ? 'bg-[#3b82f6]' : 'bg-[#dcdcdc]'}`} />
                  <span>{cup.time}</span>
                  <DotIcon dots={dotsFor(`${cup.icon}:${pickedConcept(cup.icon).id}`, pickedConcept(cup.icon).ops, style)} style={style} px={16} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-base">
              {DRINKS.map((drink, index) => {
                const concept = pickedConcept(drink.icon)
                return (
                  <span
                    key={drink.icon}
                    className={`flex min-h-8 items-center gap-2 rounded-full border px-3 whitespace-nowrap ${index === 2 ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-[#3a3a3a] text-[#757575]'}`}
                  >
                    <DotIcon dots={dotsFor(`${drink.icon}:${concept.id}`, concept.ops, style)} style={style} px={20} />
                    {drink.name} {drink.mg}
                  </span>
                )
              })}
            </div>
          </div>
        </Section>

        <Section title="5 · YOUR PICK" hint="Copy this and send it back to build the final SVG files.">
          <div className="flex flex-col items-start gap-3">
            <pre className="w-full overflow-x-auto border border-[#1f1f1f] p-4 whitespace-pre-wrap text-[#f2f2f2]">{summary}</pre>
            <button
              type="button"
              className="min-h-10 cursor-pointer rounded-full border border-[#3a3a3a] px-4 text-[#bdbdbd] transition-colors hover:border-[#f2f2f2] hover:text-[#f2f2f2] sm:min-h-8"
              onClick={copySummary}
            >
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </Section>
      </div>
    </main>
  )
}

function groupOf(icon: DrinkIconName): IconGroup {
  return ICON_GROUPS.find((group) => group.icon === icon) ?? ICON_GROUPS[0]
}

type SectionProps = { title: string; hint: string; children: React.ReactNode }

function Section({ title, hint, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base text-[#f7f7f7]">{title}</h2>
        <p className="text-[#757575]">{hint}</p>
      </div>
      {children}
    </section>
  )
}

type SegmentedProps<T> = { label: string; options: Option<T>[]; value: T; onChange: (value: T) => void }

function Segmented<T>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-[8ch] text-[#757575]">{label}</span>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          aria-pressed={option.value === value}
          className={`min-h-10 cursor-pointer rounded-full border px-3 transition-colors sm:min-h-8 ${option.value === value ? 'border-[#3b82f6] text-[#3b82f6]' : 'border-[#3a3a3a] text-[#757575] hover:border-[#f2f2f2] hover:text-[#f2f2f2]'}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

type TileProps = { group: IconGroup; concept: Concept; style: DotStyle; picked: boolean; onPick: () => void }

function ConceptTile({ group, concept, style, picked, onPick }: TileProps) {
  const dots = dotsFor(`${group.icon}:${concept.id}`, concept.ops, style)
  return (
    <button
      type="button"
      aria-pressed={picked}
      className={`flex cursor-pointer flex-col items-start gap-3 border p-3 text-left transition-colors ${picked ? 'border-[#3b82f6]' : 'border-[#1f1f1f] hover:border-[#3a3a3a]'}`}
      onClick={onPick}
    >
      <div className="flex w-full items-end justify-between gap-3">
        <DotIcon dots={dots} style={style} px={64} className="text-[#f2f2f2]" />
        <div className="flex items-end gap-2 text-[#757575]">
          {PREVIEW_PX.map((px) => (
            <DotIcon key={px} dots={dots} style={style} px={px} />
          ))}
        </div>
      </div>
      <span className={picked ? 'text-[#3b82f6]' : 'text-[#757575]'}>
        {concept.id} · {concept.label}
      </span>
    </button>
  )
}

type MatrixCellProps = { group: IconGroup; concept: Concept; style: DotStyle; active: boolean; onPick: () => void }

function MatrixCell({ group, concept, style, active, onPick }: MatrixCellProps) {
  const dots = dotsFor(`${group.icon}:${concept.id}`, concept.ops, style)
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`flex cursor-pointer items-end gap-2 border p-2 transition-colors ${active ? 'border-[#3b82f6]' : 'border-[#1f1f1f] hover:border-[#3a3a3a]'}`}
      onClick={onPick}
    >
      <DotIcon dots={dots} style={style} px={40} className="text-[#f2f2f2]" />
      <DotIcon dots={dots} style={style} px={16} className="text-[#757575]" />
    </button>
  )
}
