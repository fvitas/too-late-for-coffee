import { useState } from 'preact/hooks'
import { type Cup, type Settings, DEFAULT_SETTINGS } from './caffeine'
import { CaffeineChart } from './CaffeineChart'
import { Icon } from './Icon'
import { SettingsPanel } from './SettingsPanel'
import { usePrefersLight } from './usePrefersLight'

const INITIAL_CUPS: Cup[] = [
  { id: 1, minute: 2 * 60, mg: DEFAULT_SETTINGS.doseMg },
  { id: 2, minute: 5 * 60, mg: DEFAULT_SETTINGS.doseMg },
  { id: 3, minute: 9 * 60 + 30, mg: DEFAULT_SETTINGS.doseMg },
]

export function App() {
  const [cups, setCups] = useState<Cup[]>(INITIAL_CUPS)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [selectedId, setSelectedId] = useState<number | null>(3)
  const prefersLight = usePrefersLight()
  // Null follows the system theme until the user picks one.
  const [chosenLight, setChosenLight] = useState<boolean | null>(null)
  const light = chosenLight ?? prefersLight
  const summary = [
    `${cups.length} ${cups.length === 1 ? 'CUP' : 'CUPS'}`,
    `CAFFEINE ${cups.reduce((sum, cup) => sum + cup.mg, 0)} MG`,
    `HALF-LIFE ${settings.halfLifeH}H`,
  ]

  // The build turns light-dark() into variables set by the scheme-* classes, so the toggle swaps classes, not style.
  function toggleTheme() {
    document.documentElement.classList.remove('scheme-light-dark', 'scheme-light', 'scheme-dark')
    document.documentElement.classList.add(light ? 'scheme-dark' : 'scheme-light')
    setChosenLight(!light)
  }

  return (
    <main className="flex min-h-dvh justify-center bg-paper px-4 py-6 font-['JetBrains_Mono',ui-monospace,monospace] text-body sm:px-8 sm:py-8">
      <div className="flex w-full max-w-[min(1080px,max(22rem,calc((100dvh_-_22rem)_*_1.7)))] flex-col gap-6 sm:gap-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-[22px] leading-tight text-bright">TOO LATE FOR COFFEE?</h1>
            <p className="flex flex-wrap gap-x-[1ch] text-base text-muted sm:text-xl">
              {summary.map((part, index) => (
                <span key={part} className="whitespace-nowrap">
                  {part}
                  {index < summary.length - 1 && ' ·'}
                </span>
              ))}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-5 sm:gap-6">
            <button
              type="button"
              aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
              className="flex cursor-pointer py-2 text-muted transition-colors hover:text-bright focus-visible:text-bright"
              onClick={toggleTheme}
            >
              <Icon icon={light ? 'moon' : 'sun'} className="size-5 sm:size-6" />
            </button>
            <SettingsPanel settings={settings} onChange={setSettings} />
          </div>
        </header>
        <section className="flex flex-1 items-center">
          <CaffeineChart
            cups={cups}
            settings={settings}
            selectedId={selectedId}
            light={light}
            setCups={setCups}
            setSettings={setSettings}
            setSelectedId={setSelectedId}
          />
        </section>
        <footer className="self-end text-[8px] text-muted sm:text-[10px]">
          INSPIRED BY{' '}
          <a
            href="https://x.com/PostiauxCharles/status/2119801461278146758"
            target="_blank"
            rel="noreferrer"
            className="text-soft underline decoration-faint underline-offset-4 transition-colors hover:text-bright hover:decoration-bright"
          >
            @POSTIAUXCHARLES
          </a>
        </footer>
      </div>
    </main>
  )
}
