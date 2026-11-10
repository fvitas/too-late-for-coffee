import { useEffect, useRef, useState } from 'preact/hooks'
import { type Cup, type Settings, DEFAULT_SETTINGS, LIMIT_MIN_MG, MAX_CUPS, drinkIconFor, findPeak, formatClock, totalAt } from './caffeine'
import { Backdrop } from './Backdrop'
import { CupLimitModal } from './CupLimitModal'
import { DrinkMenu } from './DrinkMenu'
import { Icon } from './Icon'
import {
  type ChartState,
  type Point,
  CHART_RIGHT,
  DARK_PALETTE,
  LIGHT_PALETTE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  VIEW_X,
  VIEW_Y,
  chartDomain,
  chartTopMg,
  cupNear,
  drawChart,
  handleRadius,
  hitRadius,
  hoverPoint,
  isInsideChart,
  mgToY,
  minuteToX,
  toggleRadius,
  xToMinute,
  yToMg,
} from './draw'
import { useDoublePress } from './useDoublePress'

type CaffeineChartProps = {
  cups: Cup[]
  settings: Settings
  selectedId: number | null
  light: boolean
  setCups: React.Dispatch<React.SetStateAction<Cup[]>>
  setSettings: React.Dispatch<React.SetStateAction<Settings>>
  setSelectedId: (id: number | null) => void
}

type Side = 'left' | 'right'

// JetBrains Mono advance width, so label widths are known without measuring the DOM.
const CHAR_WIDTH_EM = 0.6
const LABEL_GAP_PX = 12
const HOVER_GAP_PX = 8
const COMPACT_WIDTH_PX = 640
// Half the icon button and half the drink menu, so both stay inside the chart width.
const ICON_BUTTON_HALF_PX = 18
const MENU_HALF_EM = 8
const AXIS_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24]
const SIDES: Side[] = ['right', 'left']

export function CaffeineChart({ cups, settings, selectedId, light, setCups, setSettings, setSelectedId }: CaffeineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const draggingId = useRef<number | null>(null)
  const pressCup = useDoublePress()
  const pressLimit = useDoublePress()
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 })
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [pointer, setPointer] = useState<Point | null>(null)
  const [menuCupId, setMenuCupId] = useState<number | null>(null)
  const [cupLimitOpen, setCupLimitOpen] = useState(false)
  const palette = light ? LIGHT_PALETTE : DARK_PALETTE

  const pxPerUnit = width / VIEW_WIDTH
  const yPxPerUnit = height / VIEW_HEIGHT
  const stretch = width === 0 || Math.abs(yPxPerUnit / pxPerUnit - 1) < 0.01 ? 1 : yPxPerUnit / pxPerUnit
  const compact = width < COMPACT_WIDTH_PX
  const fontPx = compact ? 13 : 16
  const toPx = (x: number) => (x - VIEW_X) * pxPerUnit
  const toPy = (y: number) => (y - VIEW_Y) * yPxPerUnit
  const textWidth = (lines: string[]) => Math.max(...lines.map((value) => value.length)) * CHAR_WIDTH_EM * fontPx
  const fits = ([start, end]: [number, number]) => start >= 0 && end <= width
  const sideFor = (x: number, labelWidth: number, gap: number): Side =>
    fits(labelSpan(x, labelWidth, 'right', gap)) ? 'right' : 'left'

  const peak = findPeak(cups, settings)
  const domain = chartDomain(peak.mg, settings.limitMg)
  const bedX = toPx(minuteToX(settings.bedMinute))
  const bedLines = [`BED ${formatClock(settings.bedMinute)}`, `${Math.round(totalAt(cups, settings.bedMinute, settings))} MG STILL IN YOU`]
  const bedWidth = textWidth(bedLines)
  const bedSide = sideFor(bedX, bedWidth, LABEL_GAP_PX)
  const peakX = toPx(minuteToX(peak.minute))
  const peakLines = [`PEAK ${Math.round(peak.mg)} MG`, formatClock(peak.minute)]
  const peakWidth = textWidth(peakLines)
  const [bedStart, bedEnd] = labelSpan(bedX, bedWidth, bedSide, LABEL_GAP_PX)
  const peakSide = SIDES.find((side) => {
    const [start, end] = labelSpan(peakX, peakWidth, side, LABEL_GAP_PX)
    return fits([start, end]) && (end + LABEL_GAP_PX < bedStart || bedEnd + LABEL_GAP_PX < start)
  })
  // The reference hides a crowded peak label. Narrow charts raise it above the bed label instead.
  const peakRaised = compact && peakSide === undefined
  const showPeak = peak.mg >= 1 && (peakSide !== undefined || peakRaised)

  const chartState: ChartState = { cups, settings, selectedId, hoveredId, pointer, pxPerUnit, stretch, showPeak, palette }
  const hover = hoverPoint(chartState, domain)
  const hoverLabel = hover ? `${formatClock(hover.minute)} · ${Math.round(hover.mg)} MG` : ''
  const hoverX = hover ? toPx(hover.x) : 0
  const hoverSide = sideFor(hoverX, textWidth([hoverLabel]) + 12, HOVER_GAP_PX)
  // Without side padding a 3-digit limit can pass the chart edge, so it then covers the end of the line.
  const limitLeft = Math.min(toPx(CHART_RIGHT) + HOVER_GAP_PX, width - textWidth([String(settings.limitMg)]) - HOVER_GAP_PX)
  const menuCup = cups.find((cup) => cup.id === menuCupId)
  const timedCups = cups.filter((cup) => cup.id === selectedId || cup.id === hoveredId)
  const clampCenter = (x: number, half: number) => Math.min(width - half, Math.max(half, x))
  const centerWithin = (x: number, label: string) => clampCenter(x, textWidth([label]) / 2)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || width === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const scaleX = canvas.width / VIEW_WIDTH
    const scaleY = canvas.height / VIEW_HEIGHT
    ctx.setTransform(scaleX, 0, 0, scaleY, -VIEW_X * scaleX, -VIEW_Y * scaleY)
    drawChart(ctx, chartState)
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return
      const selected = cups.find((cup) => cup.id === selectedId)
      if (!selected) return
      event.preventDefault()
      removeCup(selected)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cups, selectedId])

  function toPoint(event: React.MouseEvent<HTMLElement>): Point {
    const rect = canvasRef.current?.getBoundingClientRect() ?? new DOMRect()
    return {
      x: VIEW_X + ((event.clientX - rect.left) / (rect.width || 1)) * VIEW_WIDTH,
      y: VIEW_Y + ((event.clientY - rect.top) / (rect.height || 1)) * VIEW_HEIGHT,
    }
  }

  function addCup(x: number): Cup | null {
    if (cups.length >= MAX_CUPS) {
      setCupLimitOpen(true)
      return null
    }
    const cup = { id: Math.max(0, ...cups.map((current) => current.id)) + 1, minute: xToMinute(x), mg: settings.doseMg }
    setCups((current) => [...current, cup])
    setSelectedId(cup.id)
    return cup
  }

  function toggleMenu(cup: Cup) {
    setSelectedId(cup.id)
    setMenuCupId(menuCupId === cup.id ? null : cup.id)
  }

  function pickDrink(cup: Cup, mg: number) {
    setCups((current) => current.map((other) => (other.id === cup.id ? { ...other, mg } : other)))
    setMenuCupId(null)
  }

  function removeCup(cup: Cup) {
    if (cups.length === 1) return
    setCups((current) => current.filter((other) => other.id !== cup.id))
    if (selectedId === cup.id) setSelectedId(null)
    setMenuCupId((current) => (current === cup.id ? null : current))
  }

  function handleCanvasPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    setPointer(toPoint(event))
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const point = toPoint(event)
    if (!isInsideChart(point)) return
    const near = cupNear(cups, point.x, toggleRadius(pxPerUnit))
    if (near) removeCup(near)
    else addCup(point.x)
  }

  function handleTrackPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const point = toPoint(event)
    const hit = cupNear(cups, point.x, hitRadius(pxPerUnit))
    if (hit && pressCup(hit.id, event.timeStamp)) {
      removeCup(hit)
      setHoveredId(null)
      return
    }
    if (hit) setSelectedId(hit.id)
    const cup = hit ?? addCup(point.x)
    if (!cup) return
    if (!hit) pressCup(cup.id, event.timeStamp)
    draggingId.current = cup.id
    setHoveredId(cup.id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleTrackPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const point = toPoint(event)
    const id = draggingId.current
    if (id === null) {
      setHoveredId(cupNear(cups, point.x, hitRadius(pxPerUnit))?.id ?? null)
      return
    }
    setCups((current) => current.map((cup) => (cup.id === id ? { ...cup, minute: xToMinute(point.x) } : cup)))
  }

  function handleLimitPointerDown(event: React.PointerEvent<HTMLSpanElement>) {
    if (pressLimit(0, event.timeStamp)) {
      setSettings((current) => ({ ...current, limitMg: DEFAULT_SETTINGS.limitMg }))
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleLimitPointerMove(event: React.PointerEvent<HTMLSpanElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const limitMg = Math.min(chartTopMg(domain), Math.max(LIMIT_MIN_MG, Math.round(yToMg(toPoint(event).y, domain))))
    setSettings((current) => ({ ...current, limitMg }))
  }

  function handleTrackPointerUp() {
    draggingId.current = null
  }

  function handleTrackPointerLeave() {
    if (draggingId.current === null) setHoveredId(null)
  }

  return (
    <figure
      className={`relative w-full leading-tight ${compact ? 'text-[13px]' : 'text-base'} ${showPeak && peakRaised ? 'pt-[5.25em]' : 'pt-[2.75em]'}`}
    >
      <div ref={boxRef} className="relative aspect-[868/739] w-full sm:aspect-[868/462]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full cursor-crosshair touch-pan-y select-none"
          onPointerMove={handleCanvasPointerMove}
          onPointerLeave={() => setPointer(null)}
          onClick={handleCanvasClick}
        />
        <TopLabel x={bedX} width={width} side={bedSide}>
          <span className="text-bright">{bedLines[0]}</span>
          <span className="text-body">{bedLines[1]}</span>
        </TopLabel>
        {showPeak && (
          <TopLabel x={peakX} width={width} side={peakSide ?? sideFor(peakX, peakWidth, LABEL_GAP_PX)} raised={peakRaised}>
            <span className="text-body">{peakLines[0]}</span>
            <span className="text-muted">{peakLines[1]}</span>
          </TopLabel>
        )}
        <span
          className="absolute -ml-2 -translate-y-1/2 cursor-ns-resize touch-none bg-paper px-2 py-1 text-muted select-none hover:text-bright active:text-bright"
          style={{ left: limitLeft, top: Math.max(0, toPy(mgToY(settings.limitMg, domain))) }}
          onPointerDown={handleLimitPointerDown}
          onPointerMove={handleLimitPointerMove}
        >
          {settings.limitMg}
        </span>
        {hover && (
          <span
            className="pointer-events-none absolute bg-paper px-1.5 py-0.5 whitespace-nowrap text-bright"
            style={{ ...sideStyle(hoverX, width, hoverSide, HOVER_GAP_PX), bottom: height - toPy(hover.y) + HOVER_GAP_PX }}
          >
            {hoverLabel}
          </span>
        )}
      </div>
      <div className="pointer-events-none relative h-[1.5em] text-faint">
        {AXIS_HOURS.map((hour) => (
          <span
            key={hour}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: centerWithin(toPx(minuteToX(hour * 60)), '00') }}
          >
            {formatClock(hour * 60).slice(0, 2)}
          </span>
        ))}
      </div>
      <div className="pointer-events-none relative h-[1.5em]">
        {timedCups.map((cup) => (
          <span
            key={cup.id}
            className={`absolute top-0.5 -translate-x-1/2 ${cup.id === selectedId ? 'text-accent' : 'text-bright'}`}
            style={{ left: centerWithin(toPx(minuteToX(cup.minute)), formatClock(cup.minute)) }}
          >
            {formatClock(cup.minute)}
          </span>
        ))}
      </div>
      <div
        className={`relative h-10 touch-none select-none ${hoveredId !== null ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={handleTrackPointerUp}
        onPointerLeave={handleTrackPointerLeave}
      >
        {cups.map((cup) => {
          const hovered = cup.id === hoveredId
          const size = 2 * handleRadius(pxPerUnit) * pxPerUnit * (hovered ? 1.25 : 1)
          return (
            <span
              key={cup.id}
              className={`pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${cup.id === selectedId ? 'bg-accent' : hovered ? 'bg-bright' : 'bg-body'}`}
              style={{ left: toPx(minuteToX(cup.minute)), width: size, height: size }}
            />
          )
        })}
      </div>
      <div className="relative h-9 sm:h-8">
        {menuCup && (
          <>
            <Backdrop label="Close drink menu" onClose={() => setMenuCupId(null)} />
            <div
              className="absolute bottom-full z-20 mb-1 -translate-x-1/2"
              style={{ left: clampCenter(toPx(minuteToX(menuCup.minute)), MENU_HALF_EM * fontPx) }}
            >
              <DrinkMenu cup={menuCup} onPick={(mg) => pickDrink(menuCup, mg)} />
            </div>
          </>
        )}
        {cups.map((cup) => (
          <button
            key={cup.id}
            type="button"
            aria-label={`Change drink at ${formatClock(cup.minute)}`}
            aria-haspopup="menu"
            aria-expanded={menuCupId === cup.id}
            className={`absolute top-0 flex -translate-x-1/2 cursor-pointer p-2 transition-colors sm:p-1.5 ${cup.id === selectedId ? 'text-accent' : 'text-muted hover:text-bright'}`}
            style={{ left: clampCenter(toPx(minuteToX(cup.minute)), ICON_BUTTON_HALF_PX) }}
            onClick={() => toggleMenu(cup)}
          >
            <Icon icon={drinkIconFor(cup.mg)} className="size-5" />
          </button>
        ))}
      </div>
      {cupLimitOpen && <CupLimitModal onClose={() => setCupLimitOpen(false)} />}
    </figure>
  )
}

type TopLabelProps = { x: number; width: number; side: Side; raised?: boolean; children: React.ReactNode }

function TopLabel({ x, width, side, raised = false, children }: TopLabelProps) {
  return (
    <div
      className={`pointer-events-none absolute bottom-full flex flex-col pb-1 whitespace-nowrap ${side === 'left' ? 'items-end' : ''} ${raised ? 'mb-[2.5em]' : ''}`}
      style={sideStyle(x, width, side, LABEL_GAP_PX)}
    >
      {children}
    </div>
  )
}

function sideStyle(x: number, width: number, side: Side, gap: number): React.CSSProperties {
  return side === 'right' ? { left: x + gap } : { right: width - x + gap }
}

function labelSpan(x: number, labelWidth: number, side: Side, gap: number): [number, number] {
  return side === 'right' ? [x + gap, x + gap + labelWidth] : [x - gap - labelWidth, x - gap]
}
