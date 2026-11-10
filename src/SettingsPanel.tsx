import { useState } from 'react'
import { Backdrop } from './Backdrop'
import { type Settings, LIMIT_MAX_MG, LIMIT_MIN_MG, formatClock } from './caffeine'

type SettingsPanelProps = {
  settings: Settings
  onChange: (settings: Settings) => void
}

type Row = {
  label: string
  value: string
  adjust: (direction: 1 | -1) => Settings
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)

  const rows: Row[] = [
    {
      label: 'DEFAULT DOSE',
      value: `${settings.doseMg} MG`,
      adjust: (direction) => ({ ...settings, doseMg: clamp(settings.doseMg + 5 * direction, 20, 400) }),
    },
    {
      label: 'HALF-LIFE',
      value: `${settings.halfLifeH}H`,
      adjust: (direction) => ({ ...settings, halfLifeH: clamp(settings.halfLifeH + direction, 1, 12) }),
    },
    {
      label: 'BED',
      value: formatClock(settings.bedMinute),
      adjust: (direction) => ({ ...settings, bedMinute: clamp(settings.bedMinute + 15 * direction, 10 * 60, 23 * 60) }),
    },
    {
      label: 'LIMIT',
      value: `${settings.limitMg} MG`,
      adjust: (direction) => ({ ...settings, limitMg: clamp(nextStep(settings.limitMg, 5, direction), LIMIT_MIN_MG, LIMIT_MAX_MG) }),
    },
  ]

  return (
    <div className="relative shrink-0 text-sm sm:text-base">
      <button
        type="button"
        aria-expanded={open}
        className="relative z-20 cursor-pointer py-2 text-base text-muted transition-colors hover:text-bright focus-visible:text-bright focus-visible:outline-none sm:text-xl"
        onClick={() => setOpen(!open)}
      >
        {open ? 'CLOSE' : 'SETTINGS'}
      </button>
      {open && <Backdrop label="Close settings" onClose={() => setOpen(false)} />}
      {open && (
        <div className="absolute top-full right-0 z-20 mt-2 flex flex-col gap-2 rounded-md border border-line bg-paper p-4 text-muted shadow-lg shadow-shade">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-end gap-3 whitespace-nowrap">
              <span>{row.label}</span>
              <span className="w-[6ch] text-right text-bright">{row.value}</span>
              <Stepper label={`Decrease ${row.label}`} symbol="−" onClick={() => onChange(row.adjust(-1))} />
              <Stepper label={`Increase ${row.label}`} symbol="+" onClick={() => onChange(row.adjust(1))} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type StepperProps = { label: string; symbol: string; onClick: () => void }

function Stepper({ label, symbol, onClick }: StepperProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="size-10 shrink-0 cursor-pointer rounded-full border border-faint text-soft transition-colors hover:border-bright hover:text-bright focus-visible:border-bright focus-visible:outline-none sm:size-8"
      onClick={onClick}
    >
      {symbol}
    </button>
  )
}

// Dragging the limit line leaves values like 38, so the first step lands on the grid: 38 → 40 up, 38 → 35 down.
function nextStep(value: number, step: number, direction: 1 | -1): number {
  return direction > 0 ? Math.floor(value / step) * step + step : Math.ceil(value / step) * step - step
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
