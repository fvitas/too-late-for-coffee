import { useEffect, useState } from 'preact/hooks'
import { type Cup, type Settings, DEFAULT_SETTINGS, findPeak } from './caffeine'
import { CaffeineChart } from './CaffeineChart'
import { chartDomain, chartTopMg } from './draw'
import { Icon } from './Icon'
import { SettingsPanel } from './SettingsPanel'
import { parseShareQuery } from './share'
import { SharePanel } from './SharePanel'
import { usePrefersLight } from './usePrefersLight'

const INITIAL_CUPS: Cup[] = [
  { id: 1, minute: 2 * 60, mg: DEFAULT_SETTINGS.doseMg },
  { id: 2, minute: 5 * 60, mg: DEFAULT_SETTINGS.doseMg },
  { id: 3, minute: 9 * 60 + 30, mg: DEFAULT_SETTINGS.doseMg },
]

const SHARED = parseShareQuery(window.location.search)
const START_CUPS = SHARED.cups ?? INITIAL_CUPS

export function App() {
  const [cups, setCups] = useState<Cup[]>(START_CUPS)
  const [settings, setSettings] = useState<Settings>(SHARED.settings)
  const [selectedId, setSelectedId] = useState<number | null>(cups[cups.length - 1].id)
  const prefersLight = usePrefersLight()
  // Null follows the system theme until the user picks one.
  const [chosenLight, setChosenLight] = useState<boolean | null>(null)
  const light = chosenLight ?? prefersLight
  const limitMaxMg = chartTopMg(chartDomain(findPeak(cups, settings).mg, settings.limitMg))
  // The first edit drops the shared query, so the address bar no longer shows a day that is not on screen.
  useEffect(() => {
    if (cups === START_CUPS && settings === SHARED.settings) return
    if (window.location.search) history.replaceState(null, '', window.location.pathname)
  }, [cups, settings])

  const summary = [
    `${cups.length} ${cups.length === 1 ? 'CUP' : 'CUPS'}`,
    `CAFFEINE ${cups.reduce((sum, cup) => sum + cup.mg, 0)} MG`,
    `HALF-LIFE ${settings.halfLifeH}H`,
  ]

  // The build turns light-dark() into variables set by the scheme-* classes, so the toggle swaps classes, not style.
  function applyTheme() {
    document.documentElement.classList.remove('scheme-light-dark', 'scheme-light', 'scheme-dark')
    document.documentElement.classList.add(light ? 'scheme-dark' : 'scheme-light')
    setChosenLight(!light)
  }

  // The view transition hides the swap. The timeout lets Preact render and redraw the canvas before the new snapshot.
  function toggleTheme(event: React.MouseEvent<HTMLButtonElement>) {
    if (!document.startViewTransition) {
      applyTheme()
      return
    }
    // The dot reveal in index.css spreads from the centre of the toggle.
    const rect = event.currentTarget.getBoundingClientRect()
    document.documentElement.style.setProperty('--toggle-x', `${rect.left + rect.width / 2}px`)
    document.documentElement.style.setProperty('--toggle-y', `${rect.top + rect.height / 2}px`)
    document.startViewTransition(() => {
      applyTheme()
      return new Promise((resolve) => setTimeout(resolve))
    })
  }

  return (
    <main className="flex min-h-dvh justify-center bg-paper px-4 py-6 font-['JetBrains_Mono',ui-monospace,monospace] text-body sm:px-8 sm:py-8">
      <div className="flex w-full max-w-[min(1080px,max(22rem,calc((100dvh_-_22rem)_*_1.7)))] flex-col gap-6 sm:gap-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-[22px] leading-tight text-bright">TOO LATE FOR COFFEE?</h1>
            <p className="flex flex-wrap gap-x-[1ch] text-base text-dim sm:text-xl">
              {summary.map((part, index) => (
                <span key={part} className="whitespace-nowrap">
                  {part}
                  {index < summary.length - 1 && ' ·'}
                </span>
              ))}
            </p>
          </div>
          <div className="relative flex shrink-0 items-center gap-5 sm:gap-6">
            <button
              type="button"
              aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
              className="flex cursor-pointer py-2 text-muted transition-colors hover:text-bright focus-visible:text-bright"
              onClick={toggleTheme}
            >
              <Icon icon={light ? 'moon' : 'sun'} className="size-5 sm:size-6" />
            </button>
            <SharePanel cups={cups} settings={settings} />
            <SettingsPanel settings={settings} limitMaxMg={limitMaxMg} onChange={setSettings} />
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
