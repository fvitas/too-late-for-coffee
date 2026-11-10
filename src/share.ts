import {
  type Cup,
  type Settings,
  BED_RANGE_MINUTES,
  DAY_MINUTES,
  DAY_START_HOUR,
  DEFAULT_SETTINGS,
  DOSE_RANGE_MG,
  HALF_LIFE_RANGE_H,
  LIMIT_MIN_MG,
  MAX_CUPS,
  findPeak,
  formatClock,
} from './caffeine'
import { chartDomain, chartTopMg } from './draw'

export type Shared = { cups: Cup[] | null; settings: Settings }

// A full link is about 200 characters, so anything much longer is not ours.
const MAX_QUERY_LENGTH = 512
const CUP_PATTERN = /^(\d{4})-(\d{1,3})$/
const CLOCK_PATTERN = /^([01]\d|2[0-3])([0-5]\d)$/
const NUMBER_PATTERN = /^\d{1,4}$/

export function toShareQuery(cups: Cup[], settings: Settings): string {
  const parts = [`cups=${cups.map((cup) => `${toClock(cup.minute)}-${cup.mg}`).join(',')}`]
  if (settings.bedMinute !== DEFAULT_SETTINGS.bedMinute) parts.push(`bed=${toClock(settings.bedMinute)}`)
  if (settings.halfLifeH !== DEFAULT_SETTINGS.halfLifeH) parts.push(`hl=${settings.halfLifeH}`)
  if (settings.limitMg !== DEFAULT_SETTINGS.limitMg) parts.push(`limit=${settings.limitMg}`)
  if (settings.doseMg !== DEFAULT_SETTINGS.doseMg) parts.push(`dose=${settings.doseMg}`)
  return `?${parts.join('&')}`
}

// Only digits that match a strict pattern and range are read, so any other value falls back to its default.
export function parseShareQuery(search: string): Shared {
  if (search.length > MAX_QUERY_LENGTH) return { cups: null, settings: DEFAULT_SETTINGS }
  const params = new URLSearchParams(search)
  const base = {
    doseMg: parseNumber(params.get('dose'), DOSE_RANGE_MG) ?? DEFAULT_SETTINGS.doseMg,
    halfLifeH: parseNumber(params.get('hl'), HALF_LIFE_RANGE_H) ?? DEFAULT_SETTINGS.halfLifeH,
    bedMinute: parseBed(params.get('bed')) ?? DEFAULT_SETTINGS.bedMinute,
    limitMg: DEFAULT_SETTINGS.limitMg,
  }
  const cups = parseCups(params.get('cups'))
  const topMg = chartTopMg(chartDomain(findPeak(cups ?? [], base).mg, LIMIT_MIN_MG))
  const limitMg = parseNumber(params.get('limit'), [LIMIT_MIN_MG, topMg]) ?? DEFAULT_SETTINGS.limitMg
  return { cups, settings: { ...base, limitMg } }
}

function parseCups(value: string | null): Cup[] | null {
  const tokens = value?.split(',') ?? []
  if (tokens.length === 0 || tokens.length > MAX_CUPS) return null
  const cups: Cup[] = []
  for (const token of tokens) {
    const match = CUP_PATTERN.exec(token)
    const minute = match ? parseClock(match[1]) : null
    const mg = match ? parseNumber(match[2], DOSE_RANGE_MG) : null
    if (minute === null || mg === null) return null
    cups.push({ id: cups.length + 1, minute, mg })
  }
  return cups
}

function parseBed(value: string | null): number | null {
  const minute = value === null ? null : parseClock(value)
  if (minute === null || minute < BED_RANGE_MINUTES[0] || minute > BED_RANGE_MINUTES[1]) return null
  return minute
}

function parseNumber(value: string | null, [min, max]: [number, number]): number | null {
  if (value === null || !NUMBER_PATTERN.test(value)) return null
  const number = Number(value)
  return number >= min && number <= max ? number : null
}

// Clock time in the link, minutes since DAY_START_HOUR in the app.
function parseClock(value: string): number | null {
  const match = CLOCK_PATTERN.exec(value)
  if (!match) return null
  return (Number(match[1]) * 60 + Number(match[2]) - DAY_START_HOUR * 60 + DAY_MINUTES) % DAY_MINUTES
}

function toClock(minute: number): string {
  return formatClock(minute).replace(':', '')
}
