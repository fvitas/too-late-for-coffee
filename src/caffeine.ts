export type Cup = { id: number; minute: number; mg: number }

export type Drink = { name: string; mg: number; icon: DrinkIconName }

export type DrinkIconName = 'espresso' | 'pour-over' | 'matcha' | 'tea' | 'caffeine-pill' | 'cup'

export type Settings = {
  doseMg: number
  halfLifeH: number
  bedMinute: number
  limitMg: number
}

export const DAY_MINUTES = 24 * 60
export const DAY_START_HOUR = 6

export const LIMIT_MIN_MG = 5
// The top of the chart is 187.5 MG at the smallest domain, so a higher limit line leaves the chart.
export const LIMIT_MAX_MG = 185

export const DRINKS: Drink[] = [
  { name: 'TEA', mg: 30, icon: 'tea' },
  { name: 'MATCHA', mg: 60, icon: 'matcha' },
  { name: 'ESPRESSO', mg: 75, icon: 'espresso' },
  { name: 'BREWED COFFEE', mg: 95, icon: 'cup' },
  { name: 'POUR-OVER', mg: 135, icon: 'pour-over' },
  { name: 'CAFFEINE PILL', mg: 200, icon: 'caffeine-pill' },
]

export function drinkIconFor(mg: number): DrinkIconName {
  return DRINKS.find((drink) => drink.mg === mg)?.icon ?? 'cup'
}

export const DEFAULT_SETTINGS: Settings = {
  doseMg: 95,
  halfLifeH: 5,
  bedMinute: 17 * 60,
  limitMg: 50,
}

// Absorption rate in 1/h, fitted to the reference peaks and bedtime levels.
const ABSORPTION_RATE = 2.8

function eliminationRate(settings: Settings): number {
  return Math.LN2 / settings.halfLifeH
}

export function contributionAt(ageHours: number, mg: number, settings: Settings): number {
  if (ageHours <= 0) return 0
  const ke = eliminationRate(settings)
  const scale = ABSORPTION_RATE / (ABSORPTION_RATE - ke)
  return mg * scale * (Math.exp(-ke * ageHours) - Math.exp(-ABSORPTION_RATE * ageHours))
}

export function cupContribution(cup: Cup, minute: number, settings: Settings): number {
  return contributionAt((minute - cup.minute) / 60, cup.mg, settings)
}

export function totalAt(cups: Cup[], minute: number, settings: Settings): number {
  return cups.reduce((sum, cup) => sum + cupContribution(cup, minute, settings), 0)
}

export function findPeak(cups: Cup[], settings: Settings): { minute: number; mg: number } {
  let best = { minute: 0, mg: 0 }
  for (let minute = 0; minute <= DAY_MINUTES; minute++) {
    const mg = totalAt(cups, minute, settings)
    if (mg > best.mg) best = { minute, mg }
  }
  return best
}

export function sortByTime(cups: Cup[]): Cup[] {
  return [...cups].sort((a, b) => a.minute - b.minute)
}

export function formatClock(minute: number): string {
  const total = (DAY_START_HOUR * 60 + Math.round(minute)) % DAY_MINUTES
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
