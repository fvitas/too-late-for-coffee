import { type Settings, BED_RANGE_MINUTES, DOSE_RANGE_MG, HALF_LIFE_RANGE_H, LIMIT_MIN_MG, formatClock } from './caffeine'
import { Popover } from './Popover'

type SettingsPanelProps = {
  settings: Settings
  limitMaxMg: number
  onChange: (settings: Settings) => void
}

type Row = {
  label: string
  value: string
  adjust: (direction: 1 | -1) => Settings
}

export function SettingsPanel({ settings, limitMaxMg, onChange }: SettingsPanelProps) {
  const rows: Row[] = [
    {
      label: 'DEFAULT DOSE',
      value: `${settings.doseMg} MG`,
      adjust: (direction) => ({ ...settings, doseMg: clamp(settings.doseMg + 5 * direction, ...DOSE_RANGE_MG) }),
    },
    {
      label: 'HALF-LIFE',
      value: `${settings.halfLifeH}H`,
      adjust: (direction) => ({ ...settings, halfLifeH: clamp(settings.halfLifeH + direction, ...HALF_LIFE_RANGE_H) }),
    },
    {
      label: 'BED',
      value: formatClock(settings.bedMinute),
      adjust: (direction) => ({ ...settings, bedMinute: clamp(settings.bedMinute + 15 * direction, ...BED_RANGE_MINUTES) }),
    },
    {
      label: 'LIMIT',
      value: `${settings.limitMg} MG`,
      adjust: (direction) => ({ ...settings, limitMg: clamp(nextStep(settings.limitMg, 5, direction), LIMIT_MIN_MG, limitMaxMg) }),
    },
  ]

  return (
    <Popover label="SETTINGS" closeLabel="Close settings">
      {() =>
        rows.map((row) => (
          <div key={row.label} className="flex items-center justify-end gap-3 whitespace-nowrap">
            <span>{row.label}</span>
            <span className="w-[6ch] text-right text-bright">{row.value}</span>
            <Stepper label={`Decrease ${row.label}`} symbol="−" onClick={() => onChange(row.adjust(-1))} />
            <Stepper label={`Increase ${row.label}`} symbol="+" onClick={() => onChange(row.adjust(1))} />
          </div>
        ))
      }
    </Popover>
  )
}

type StepperProps = { label: string; symbol: string; onClick: () => void }

function Stepper({ label, symbol, onClick }: StepperProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="size-10 shrink-0 cursor-pointer rounded-full border border-faint text-soft transition-colors hover:border-bright hover:text-bright focus-visible:border-bright sm:size-8"
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
