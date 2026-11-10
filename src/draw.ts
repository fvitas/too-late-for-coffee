import { type Cup, type Settings, DAY_MINUTES, cupContribution, findPeak, sortByTime, totalAt } from './caffeine'

export const CHART_LEFT = 130
export const CHART_RIGHT = 950
// Part of the 1080 px design space that the canvas shows. Text lives in the DOM around it.
export const VIEW_X = 106
export const VIEW_Y = 350
export const VIEW_WIDTH = 868
export const VIEW_HEIGHT = 462

const BASE_Y = 800
const TOP_Y = 350
const HANDLE_RADIUS = 8
const HANDLE_HIT_RADIUS = 14
// Floors in CSS pixels so handles stay visible and touchable on small screens.
const MIN_HANDLE_PX = 7
const MIN_HIT_PX = 22
// Clicking within this distance of a cup inside the chart removes it instead of adding a new one.
const TOGGLE_RADIUS = 10
const MIN_TOGGLE_PX = 8
const PITCH = 8
const COLUMNS = 103
const ROWS = 52
const COLUMN_WIDTH = (CHART_RIGHT - CHART_LEFT) / COLUMNS
const FIRST_DOT_Y = 791.5
// Value axis heights: lines span 400 px above the axis, dot rows span 46 pitches above the first row.
const LINE_SPAN = 400
const DOT_SPAN = 368
const MIN_DOMAIN_MG = 400 / 2.4
// The top of the chart at its smallest domain, so the limit line always stays inside the chart.
export const LIMIT_MAX_MG = Math.floor(((BASE_Y - VIEW_Y) / LINE_SPAN) * MIN_DOMAIN_MG)
// After its local peak a column cools from the bright rising look to the settled look over this time.
const COOL_MINUTES = 60
// The selected cup fades from blue to grey between these minutes from its peak.
const BLUE_START_MINUTES = -60
const BLUE_MINUTES = 130
// Higher rows start fading later, so the blue edge leans to the right.
const BLUE_LEAN_MINUTES = 70
// Floors for selected dots while they are still blue, so the band reads across the full height.
const BLUE_MIN_SIZE = 0.08
const BLUE_MIN_ALPHA = 0.9
const GUIDE_START_Y = 807.5

const BLUE_DOT = [52, 132, 255]

// Dots are ink with alpha on the page colour: white on dark, near-black on light.
export type Palette = {
  ink: number[]
  bright: string
  subtle: string
  axis: string
  bedLine: string
  peakLine: string
  guideBlue: string
}

export const DARK_PALETTE: Palette = {
  ink: [255, 255, 255],
  bright: '#f7f7f7',
  subtle: '#3a3a3a',
  axis: '#1f1f1f',
  bedLine: '#6f6f6f',
  peakLine: '#3b3b3b',
  guideBlue: 'rgb(103,127,179)',
}

export const LIGHT_PALETTE: Palette = {
  ink: [17, 17, 17],
  bright: '#111111',
  subtle: '#c4c4c4',
  axis: '#e2e2e0',
  bedLine: '#8f8f8f',
  peakLine: '#c4c4c4',
  guideBlue: 'rgb(140,165,215)',
}

export type Point = { x: number; y: number }

export type ChartState = {
  cups: Cup[]
  settings: Settings
  selectedId: number | null
  hoveredId: number | null
  pointer: Point | null
  pxPerUnit: number
  stretch: number
  showPeak: boolean
  palette: Palette
}

export type HoverPoint = { minute: number; mg: number; x: number; y: number }

type Peak = { minute: number; mg: number }

type Cell = { row: number; alpha: number; rgb: string; radius: number }

export function minuteToX(minute: number): number {
  return CHART_LEFT + (minute / DAY_MINUTES) * (CHART_RIGHT - CHART_LEFT)
}

export function xToMinute(x: number): number {
  const minute = Math.round(((x - CHART_LEFT) / (CHART_RIGHT - CHART_LEFT)) * DAY_MINUTES)
  return Math.min(DAY_MINUTES, Math.max(0, minute))
}

export function mgToY(mg: number, domain: number): number {
  return BASE_Y - (mg / domain) * LINE_SPAN
}

export function yToMg(y: number, domain: number): number {
  return ((BASE_Y - y) / LINE_SPAN) * domain
}

export function mgToDotY(mg: number, domain: number): number {
  return FIRST_DOT_Y - (mg / domain) * DOT_SPAN
}

function rowY(row: number): number {
  return FIRST_DOT_Y - row * PITCH
}

function rowsFor(mg: number, domain: number): number {
  if (mg <= 0) return 0
  return Math.min(ROWS, Math.round(((mg / domain) * DOT_SPAN) / PITCH) + 1)
}

export function chartDomain(peakMg: number): number {
  return Math.max(peakMg, MIN_DOMAIN_MG)
}

export function handleRadius(pxPerUnit: number): number {
  return Math.max(HANDLE_RADIUS, MIN_HANDLE_PX / pxPerUnit)
}

export function hitRadius(pxPerUnit: number): number {
  return Math.max(HANDLE_HIT_RADIUS, MIN_HIT_PX / pxPerUnit)
}

export function toggleRadius(pxPerUnit: number): number {
  return Math.max(TOGGLE_RADIUS, MIN_TOGGLE_PX / pxPerUnit)
}

export function isInsideChart(point: Point): boolean {
  return point.x >= CHART_LEFT && point.x <= CHART_RIGHT && point.y >= TOP_Y && point.y <= BASE_Y
}

export function cupNear(cups: Cup[], x: number, radius: number): Cup | undefined {
  const distance = (cup: Cup) => Math.abs(minuteToX(cup.minute) - x)
  const near = cups.filter((cup) => distance(cup) <= radius)
  return near.sort((a, b) => distance(a) - distance(b))[0]
}

export function hoverPoint(state: ChartState, domain: number): HoverPoint | null {
  const { cups, pointer } = state
  if (!pointer || state.hoveredId !== null || !isInsideChart(pointer)) return null
  if (cupNear(cups, pointer.x, toggleRadius(state.pxPerUnit))) return null
  const minute = xToMinute(pointer.x)
  const mg = totalAt(cups, minute, state.settings)
  return { minute, mg, x: minuteToX(minute), y: mgToDotY(mg, domain) }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(from: number, to: number, value: number): number {
  const t = clamp01((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

function blueMix(ink: number[], amount: number): string {
  return BLUE_DOT.map((channel, index) => Math.round(ink[index] + (channel - ink[index]) * amount)).join(',')
}

function radiusFor(alpha: number): number {
  return 1.2 + 2.8 * alpha ** 0.8
}

type Pen = {
  dot: (x: number, y: number, radius: number, color: string) => void
  line: (x1: number, y1: number, x2: number, y2: number, color: string, dash?: number[]) => void
  square: (x: number, y: number, color: string) => void
}

// The canvas may be taller than the design space on narrow screens, so shapes undo the vertical stretch to stay round.
function createPen(ctx: CanvasRenderingContext2D, stretch: number): Pen {
  return {
    dot(x, y, radius, color) {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(x, y, radius, radius / stretch, 0, 0, Math.PI * 2)
      ctx.fill()
    },
    line(x1, y1, x2, y2, color, dash = []) {
      ctx.strokeStyle = color
      ctx.lineWidth = y1 === y2 ? 2 / stretch : 2
      ctx.setLineDash(dash)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.setLineDash([])
    },
    square(x, y, color) {
      ctx.fillStyle = color
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1 / stretch, 2, 2 / stretch)
    },
  }
}

// Pixel column that a 2 px line covers, so lines land on whole pixels like the reference.
function crisp(x: number): number {
  return Math.floor(x) + 1
}

export function drawChart(ctx: CanvasRenderingContext2D, state: ChartState) {
  const cups = sortByTime(state.cups)
  const peak = findPeak(cups, state.settings)
  const domain = chartDomain(peak.mg)
  const pen = createPen(ctx, state.stretch)
  drawColumns(pen, cups, state, peak, domain)
  const palette = state.palette
  drawLimit(pen, state.settings, domain, palette)
  drawAxis(pen, palette)
  drawBed(pen, state.settings, palette)
  if (state.showPeak) drawPeak(pen, peak, domain, palette)
  drawGuides(pen, cups, state, domain)
  const hover = hoverPoint(state, domain)
  if (hover) pen.dot(hover.x, hover.y, 4, palette.bright)
}

function settledAlpha(share: number): number {
  return 0.27 * smoothstep(0.12, 0.9, share)
}

// Minute at which the total stops rising after a cup lands.
function localPeakAfter(cups: Cup[], cup: Cup, settings: Settings): number {
  let minute = cup.minute
  while (minute < DAY_MINUTES && totalAt(cups, minute + 1, settings) > totalAt(cups, minute, settings)) minute++
  return minute
}

function columnCells(cups: Cup[], x: number, state: ChartState, domain: number, peaks: Map<number, number>): Cell[] {
  const minute = xToMinute(x)
  const active = cups.filter((cup) => cup.minute <= minute)
  if (active.length === 0) return []
  const newest = active[active.length - 1]
  const settings = state.settings
  const total = totalAt(cups, minute, settings)
  const rows = rowsFor(total, domain)
  if (rows === 0) return []

  const isFirst = active.length === 1
  const sincePeak = minute - (peaks.get(newest.id) ?? minute)
  const heat = (1 - clamp01(sincePeak / COOL_MINUTES)) ** 2
  const isSelected = newest.id === state.selectedId
  const bandStart = isFirst ? 0 : rowsFor(total - cupContribution(newest, minute, settings), domain)
  const cells: Cell[] = []
  for (let row = 0; row < rows; row++) {
    const share = (row + 0.5) / rows
    const settled = settledAlpha(share)
    // The top row is only partly filled, so it renders dimmer.
    const fill = row === rows - 1 ? 0.75 : 1
    const ramp = 0.85 * clamp01((row - 4) / Math.max(1, rows - 5)) * fill
    const alpha = settled + heat * Math.max(0, ramp - settled)
    const fade = smoothstep(BLUE_START_MINUTES, BLUE_MINUTES, sincePeak - BLUE_LEAN_MINUTES * share)
    const tint = isSelected && row >= bandStart ? 1 - fade : 0
    // The blue floors fade out near the axis so the band does not end in a hard block.
    const floor = tint * smoothstep(0.04, 0.2, share)
    if (alpha < 0.01 && floor < 0.01) continue
    // A later cup's band rises in solid blue, but its size follows the same gradient as the grey dots.
    const solid = isFirst ? 0 : heat * tint
    const radius = radiusFor(Math.max(alpha, BLUE_MIN_SIZE * floor))
    cells.push({ row, alpha: Math.max(alpha, BLUE_MIN_ALPHA * floor, solid), rgb: blueMix(state.palette.ink, tint), radius })
  }
  return cells
}

function drawColumns(pen: Pen, cups: Cup[], state: ChartState, peak: Peak, domain: number) {
  const gridStartX = peak.mg > 0 ? minuteToX(peak.minute) - 12 : CHART_RIGHT
  const bedX = minuteToX(state.settings.bedMinute)
  const peaks = new Map(cups.map((cup) => [cup.id, localPeakAfter(cups, cup, state.settings)]))
  for (let column = 0; column < COLUMNS; column++) {
    const x = CHART_LEFT + (column + 0.5) * COLUMN_WIDTH
    const cells = columnCells(cups, x, state, domain, peaks)
    for (const cell of cells) {
      pen.dot(x, rowY(cell.row), cell.radius, `rgba(${cell.rgb},${cell.alpha})`)
    }
    if (x < gridStartX || Math.abs(x - bedX) < 6) continue
    const firstEmpty = cells.length === 0 ? 0 : cells[cells.length - 1].row + 1
    for (let row = firstEmpty; row < ROWS; row++) {
      if ((column + row) % 2 === 0) continue
      pen.dot(x, rowY(row), 1, `rgba(${state.palette.ink},0.03)`)
    }
  }
}

function drawLimit(pen: Pen, settings: Settings, domain: number, palette: Palette) {
  const y = crisp(mgToY(settings.limitMg, domain))
  pen.line(CHART_LEFT, y, CHART_RIGHT, y, palette.subtle, [4, 8])
}

function drawAxis(pen: Pen, palette: Palette) {
  pen.line(CHART_LEFT, BASE_Y + 1, CHART_RIGHT + 2, BASE_Y + 1, palette.axis)
  for (let hour = 0; hour <= 24; hour += 3) {
    const x = crisp(minuteToX(hour * 60))
    pen.line(x, BASE_Y + 1, x, BASE_Y + 9, palette.subtle)
  }
}

function drawBed(pen: Pen, settings: Settings, palette: Palette) {
  const x = crisp(minuteToX(settings.bedMinute))
  pen.line(x, TOP_Y, x, FIRST_DOT_Y, palette.bedLine)
}

function drawPeak(pen: Pen, peak: Peak, domain: number, palette: Palette) {
  const x = crisp(minuteToX(peak.minute))
  pen.line(x, TOP_Y, x, rowY(rowsFor(peak.mg, domain) - 1) - 4, palette.peakLine)
}

function drawGuides(pen: Pen, cups: Cup[], state: ChartState, domain: number) {
  for (const cup of cups) {
    const x = minuteToX(cup.minute)
    const selected = cup.id === state.selectedId
    const topY = mgToDotY(totalAt(cups, cup.minute + 60, state.settings), domain)
    const color = selected ? state.palette.guideBlue : state.palette.subtle
    for (let y = GUIDE_START_Y; y >= topY; y -= PITCH) pen.square(x, y, color)
  }
}

