import { useState } from 'react'
import { type Cup, type Settings, DEFAULT_SETTINGS } from './caffeine'
import { CaffeineChart } from './CaffeineChart'
import { SettingsPanel } from './SettingsPanel'

const INITIAL_CUPS: Cup[] = [
  { id: 1, minute: 2 * 60, mg: DEFAULT_SETTINGS.doseMg },
  { id: 2, minute: 5 * 60, mg: DEFAULT_SETTINGS.doseMg },
  { id: 3, minute: 9 * 60 + 30, mg: DEFAULT_SETTINGS.doseMg },
]

export function App() {
  const [cups, setCups] = useState<Cup[]>(INITIAL_CUPS)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [selectedId, setSelectedId] = useState<number | null>(3)
  const summary = [
    `${cups.length} ${cups.length === 1 ? 'CUP' : 'CUPS'}`,
    `CAFFEINE ${cups.reduce((sum, cup) => sum + cup.mg, 0)} MG`,
    `HALF-LIFE ${settings.halfLifeH}H`,
  ]

  return (
    <main className="flex min-h-dvh justify-center bg-[#0e0e0e] px-4 py-6 font-['JetBrains_Mono',ui-monospace,monospace] text-[#dcdcdc] sm:px-8 sm:py-8">
      <div className="flex w-full max-w-[min(1080px,max(22rem,calc((100dvh_-_22rem)_*_1.7)))] flex-col gap-6 sm:gap-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-[22px] leading-tight text-[#f7f7f7]">TOO LATE FOR COFFEE?</h1>
            <p className="flex flex-wrap gap-x-[1ch] text-base text-[#757575] sm:text-xl">
              {summary.map((part, index) => (
                <span key={part} className="whitespace-nowrap">
                  {part}
                  {index < summary.length - 1 && ' ·'}
                </span>
              ))}
            </p>
          </div>
          <SettingsPanel settings={settings} onChange={setSettings} />
        </header>
        <section className="flex flex-1 items-center">
          <CaffeineChart
            cups={cups}
            settings={settings}
            selectedId={selectedId}
            setCups={setCups}
            setSettings={setSettings}
            setSelectedId={setSelectedId}
          />
        </section>
        <footer className="self-end text-xs text-[#757575]">
          INSPIRED BY{' '}
          <a
            href="https://x.com/PostiauxCharles/status/2119801461278146758"
            target="_blank"
            rel="noreferrer"
            className="text-[#bdbdbd] underline decoration-[#3a3a3a] underline-offset-4 transition-colors hover:text-[#f2f2f2] hover:decoration-[#f2f2f2]"
          >
            @POSTIAUXCHARLES
          </a>
        </footer>
      </div>
    </main>
  )
}
