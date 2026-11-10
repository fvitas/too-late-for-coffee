import { type DrinkIconName } from '../caffeine'

type Inside = (x: number, y: number) => boolean
type Op = { inside: Inside; tone: number; cut: boolean; where?: Inside }
type Pt = [number, number]

export type Concept = { id: string; label: string; ops: Op[] }
export type IconGroup = { icon: DrinkIconName; name: string; concepts: Concept[] }
export type Mode = 'solid' | 'halftone' | 'fade' | 'outline' | 'chart'
export type DotShape = 'circle' | 'square' | 'rounded'
export type DotStyle = { grid: number; mode: Mode; shape: DotShape; size: number; lattice: boolean }
export type Dot = { cx: number; cy: number; r: number; opacity: number }

const SAMPLES = 6
const LATTICE_OPACITY = 0.12

function rect(x0: number, y0: number, x1: number, y1: number, radius = 0): Inside {
  return (x, y) => {
    const dx = Math.max(x0 + radius - x, 0, x - (x1 - radius))
    const dy = Math.max(y0 + radius - y, 0, y - (y1 - radius))
    return x >= x0 && x <= x1 && y >= y0 && y <= y1 && dx * dx + dy * dy <= radius * radius
  }
}

function circle(cx: number, cy: number, r: number): Inside {
  return (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

function rotate(cx: number, cy: number, deg: number, dx: number, dy: number): Pt {
  const a = (deg * Math.PI) / 180
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]
}

function ellipse(cx: number, cy: number, rx: number, ry: number, deg = 0): Inside {
  return (x, y) => {
    const [px, py] = rotate(0, 0, -deg, x - cx, y - cy)
    return (px / rx) ** 2 + (py / ry) ** 2 <= 1
  }
}

function poly(points: Pt[]): Inside {
  return (x, y) => {
    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i]
      const [xj, yj] = points[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }
}

function line([x0, y0]: Pt, [x1, y1]: Pt, width: number): Inside {
  return (x, y) => {
    const dx = x1 - x0
    const dy = y1 - y0
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)))
    return (x - x0 - t * dx) ** 2 + (y - y0 - t * dy) ** 2 <= (width / 2) ** 2
  }
}

function pixels(rows: string[]): Inside[] {
  const at = (mark: string): Inside => (x, y) => rows[Math.floor(y * rows.length)]?.[Math.floor(x * rows.length)] === mark
  return [at('#'), at('o')]
}

function add(inside: Inside, tone = 1, where?: Inside): Op {
  return { inside, tone, cut: false, where }
}

function cut(inside: Inside): Op {
  return { inside, tone: 0, cut: true }
}

function hand(rows: string[], id = 'H', label = 'HAND 8×8'): Concept {
  const [main, soft] = pixels(rows)
  return { id, label, ops: [add(main), add(soft, 0.35)] }
}

function mug(top: number): Op[] {
  return [add(circle(0.74, top + 0.28, 0.15)), cut(circle(0.74, top + 0.28, 0.08)), add(rect(0.12, top, 0.7, top + 0.58, 0.08))]
}

const leafTip = rotate(0.52, 0.46, 40, 0, 0.4)
const takeawayBody = poly([[0.24, 0.24], [0.76, 0.24], [0.68, 0.92], [0.32, 0.92]])

export const ICON_GROUPS: IconGroup[] = [
  {
    icon: 'espresso',
    name: 'ESPRESSO',
    concepts: [
      {
        id: 'A',
        label: 'CUP + SAUCER',
        ops: [
          add(circle(0.74, 0.5, 0.14)),
          cut(circle(0.74, 0.5, 0.07)),
          add(rect(0.16, 0.34, 0.7, 0.76, 0.1)),
          add(rect(0.06, 0.8, 0.94, 0.9, 0.05)),
          add(line([0.32, 0.08], [0.32, 0.26], 0.07), 0.4),
          add(line([0.5, 0.06], [0.5, 0.24], 0.07), 0.4),
        ],
      },
      {
        id: 'B',
        label: 'TOP VIEW',
        ops: [
          add(circle(0.48, 0.5, 0.44), 0.35),
          add(circle(0.48, 0.5, 0.3)),
          cut(circle(0.48, 0.5, 0.2)),
          add(circle(0.48, 0.5, 0.2), 0.65),
          add(rect(0.76, 0.44, 0.98, 0.56, 0.04)),
        ],
      },
      {
        id: 'C',
        label: 'BEAN',
        ops: [add(ellipse(0.5, 0.5, 0.3, 0.42, 30)), cut(line(rotate(0.5, 0.5, 30, 0, -0.3), rotate(0.5, 0.5, 30, 0, 0.3), 0.08))],
      },
      hand(['........', '..#.#...', '........', '.#####..', '.######.', '.#####.#', '..###...', '#######.']),
    ],
  },
  {
    icon: 'pour-over',
    name: 'POUR-OVER',
    concepts: [
      {
        id: 'A',
        label: 'V60 ON CUP',
        ops: [
          add(rect(0.06, 0.1, 0.94, 0.18, 0.03)),
          add(poly([[0.14, 0.18], [0.86, 0.18], [0.6, 0.5], [0.4, 0.5]])),
          add(circle(0.5, 0.6, 0.04), 0.5),
          add(rect(0.22, 0.68, 0.78, 0.94, 0.06)),
        ],
      },
      {
        id: 'B',
        label: 'CHEMEX',
        ops: [
          add(poly([[0.2, 0.06], [0.8, 0.06], [0.56, 0.46], [0.44, 0.46]])),
          add(poly([[0.44, 0.46], [0.56, 0.46], [0.84, 0.94], [0.16, 0.94]])),
          add(rect(0.34, 0.38, 0.66, 0.54, 0.04), 0.5),
        ],
      },
      {
        id: 'C',
        label: 'GOOSENECK',
        ops: [
          add(circle(0.82, 0.62, 0.14)),
          cut(circle(0.82, 0.62, 0.07)),
          add(rect(0.3, 0.4, 0.82, 0.9, 0.12)),
          add(rect(0.42, 0.3, 0.7, 0.4, 0.03)),
          add(circle(0.56, 0.24, 0.05)),
          add(line([0.34, 0.76], [0.08, 0.34], 0.07)),
        ],
      },
      hand(['########', '.######.', '..####..', '...##...', '........', '.######.', '.######.', '..####..']),
    ],
  },
  {
    icon: 'matcha',
    name: 'MATCHA',
    concepts: [
      {
        id: 'A',
        label: 'BOWL + WHISK',
        ops: [
          add(rect(0.46, 0.06, 0.54, 0.3), 0.5),
          add(poly([[0.44, 0.3], [0.56, 0.3], [0.64, 0.48], [0.36, 0.48]]), 0.5),
          add(circle(0.5, 0.5, 0.42), 1, (_x, y) => y >= 0.5),
          add(rect(0.06, 0.48, 0.94, 0.54, 0.02)),
          add(rect(0.36, 0.9, 0.64, 0.96)),
        ],
      },
      {
        id: 'B',
        label: 'LEAF',
        ops: [
          add(ellipse(0.52, 0.46, 0.2, 0.4, 40)),
          cut(line(rotate(0.52, 0.46, 40, 0, -0.3), rotate(0.52, 0.46, 40, 0, 0.3), 0.05)),
          add(line(leafTip, rotate(leafTip[0], leafTip[1], 40, 0, 0.12), 0.06)),
        ],
      },
      {
        id: 'C',
        label: 'CHASEN',
        ops: [
          add(rect(0.44, 0.04, 0.56, 0.4, 0.02)),
          add(poly([[0.38, 0.4], [0.62, 0.4], [0.84, 0.92], [0.16, 0.92]])),
          cut(line([0.5, 0.52], [0.5, 0.92], 0.05)),
          cut(line([0.44, 0.52], [0.32, 0.92], 0.05)),
          cut(line([0.56, 0.52], [0.68, 0.92], 0.05)),
        ],
      },
      hand(
        [
          '................', '....##....##....', '.....##..##.....', '.....##..##.....', '....##....##....', '....##....##....', '.....##..##.....', '................', '.##############.', '.##############.', '.##############.', '..############..', '..############..', '...##########...', '.....######.....', '......####......',
        ],
        'H',
        'HAND · ROUND BOWL',
      ),
      hand(['....#...', '...#....', '...#....', '....#...', '........', '.######.', '.######.', '..####..'], 'I', 'HAND · ONE WISP'),
    ],
  },
  {
    icon: 'tea',
    name: 'TEA',
    concepts: [
      {
        id: 'A',
        label: 'MUG + TAG',
        ops: [...mug(0.32), add(line([0.3, 0.34], [0.18, 0.14], 0.04), 0.5), add(rect(0.04, 0.02, 0.22, 0.16, 0.02), 0.5)],
      },
      {
        id: 'B',
        label: 'TEAPOT',
        ops: [
          add(circle(0.8, 0.58, 0.15)),
          cut(circle(0.8, 0.58, 0.08)),
          add(ellipse(0.5, 0.62, 0.32, 0.28)),
          add(ellipse(0.5, 0.32, 0.16, 0.06)),
          add(circle(0.5, 0.22, 0.05)),
          add(poly([[0.24, 0.62], [0.06, 0.36], [0.13, 0.33], [0.3, 0.54]])),
        ],
      },
      {
        id: 'C',
        label: 'TEA BAG',
        ops: [
          add(line([0.5, 0.1], [0.5, 0.34], 0.04), 0.5),
          add(rect(0.36, 0.02, 0.64, 0.16, 0.03), 0.5),
          add(poly([[0.36, 0.3], [0.64, 0.3], [0.78, 0.44], [0.78, 0.94], [0.22, 0.94], [0.22, 0.44]])),
        ],
      },
      hand(['...#....', '...#....', '#######.', '######.#', '######.#', '#######.', '.#####..', '........']),
    ],
  },
  {
    icon: 'caffeine-pill',
    name: 'CAFFEINE PILL',
    concepts: [
      {
        id: 'A',
        label: 'CAPSULE',
        ops: [add(line([0.16, 0.5], [0.84, 0.5], 0.38), 0.4), add(line([0.16, 0.5], [0.84, 0.5], 0.38), 1, (x) => x <= 0.5)],
      },
      {
        id: 'B',
        label: 'DIAGONAL',
        ops: [add(line([0.2, 0.8], [0.8, 0.2], 0.34), 0.4), add(line([0.2, 0.8], [0.8, 0.2], 0.34), 1, (x, y) => x <= y)],
      },
      {
        id: 'C',
        label: 'TABLET',
        ops: [add(circle(0.5, 0.5, 0.38)), cut(line([0.2, 0.5], [0.8, 0.5], 0.07))],
      },
      hand(['........', '........', '.###ooo.', '####oooo', '####oooo', '.###ooo.', '........', '........']),
    ],
  },
  {
    icon: 'cup',
    name: 'CUP (DEFAULT)',
    concepts: [
      { id: 'A', label: 'MUG', ops: mug(0.28) },
      {
        id: 'B',
        label: 'TAKEAWAY',
        ops: [add(rect(0.18, 0.1, 0.82, 0.22, 0.03)), add(takeawayBody), add(rect(0.2, 0.46, 0.8, 0.62), 0.45, takeawayBody)],
      },
      {
        id: 'C',
        label: 'STEAMING',
        ops: [...mug(0.36), add(line([0.28, 0.06], [0.28, 0.24], 0.07), 0.4), add(line([0.48, 0.04], [0.48, 0.22], 0.07), 0.4)],
      },
      hand(['........', '........', '#####...', '#####.#.', '#####.#.', '######..', '.####...', '........']),
    ],
  },
]

type Cell = { cover: number; tone: number }

const coverCache = new Map<string, Cell[]>()

function toneAt(ops: Op[], x: number, y: number): number {
  let tone = 0
  for (const op of ops) {
    if (op.inside(x, y) && (!op.where || op.where(x, y))) tone = op.cut ? 0 : op.tone
  }
  return tone
}

// Coverage per cell from supersampling, cached because it only depends on the concept and the grid.
function cellsFor(key: string, ops: Op[], grid: number): Cell[] {
  const cacheKey = `${key}:${grid}`
  const cached = coverCache.get(cacheKey)
  if (cached) return cached
  const cells: Cell[] = []
  for (let row = 0; row < grid; row++) {
    for (let col = 0; col < grid; col++) {
      let hits = 0
      let toneSum = 0
      for (let a = 0; a < SAMPLES; a++) {
        for (let b = 0; b < SAMPLES; b++) {
          const tone = toneAt(ops, (col + (a + 0.5) / SAMPLES) / grid, (row + (b + 0.5) / SAMPLES) / grid)
          if (tone > 0) {
            hits++
            toneSum += tone
          }
        }
      }
      cells.push({ cover: hits / SAMPLES ** 2, tone: hits ? toneSum / hits : 0 })
    }
  }
  coverCache.set(cacheKey, cells)
  return cells
}

export function dotsFor(key: string, ops: Op[], style: DotStyle): Dot[] {
  const { grid, mode, size, lattice } = style
  const cells = cellsFor(key, ops, grid)
  const filled = (row: number, col: number) =>
    row >= 0 && col >= 0 && row < grid && col < grid && cells[row * grid + col].cover >= 0.5
  const dots: Dot[] = []
  cells.forEach(({ cover, tone }, index) => {
    const row = Math.floor(index / grid)
    const col = index % grid
    const lift = 1 - row / Math.max(1, grid - 1)
    const edge = !filled(row - 1, col) || !filled(row + 1, col) || !filled(row, col - 1) || !filled(row, col + 1)
    const visible = {
      solid: cover >= 0.5,
      halftone: cover > 0.04,
      fade: cover > 0.04,
      outline: cover >= 0.5 && edge,
      chart: cover > 0.04,
    }[mode]
    const dot = { cx: 1 + 2 * col, cy: 1 + 2 * row }
    if (!visible) {
      if (lattice) dots.push({ ...dot, r: 0.35 * size, opacity: LATTICE_OPACITY })
      return
    }
    const r = {
      solid: size,
      halftone: size * Math.sqrt(cover),
      fade: size,
      outline: size,
      chart: size * Math.sqrt(cover) * (0.55 + 0.45 * lift),
    }[mode]
    const opacity = { solid: tone, halftone: tone, fade: tone * cover, outline: tone, chart: tone * (0.4 + 0.6 * lift) }[mode]
    dots.push({ ...dot, r, opacity })
  })
  return dots
}

export function svgFor(dots: Dot[], style: DotStyle): string {
  const body = dots.map((dot) => `  ${dotMarkup(dot, style.shape)}`).join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${2 * style.grid} ${2 * style.grid}">\n${body}\n</svg>\n`
}

function dotMarkup({ cx, cy, r, opacity }: Dot, shape: DotShape): string {
  const fill = `fill="currentColor"${opacity < 1 ? ` fill-opacity="${opacity.toFixed(2)}"` : ''}`
  const round = (value: number) => Number(value.toFixed(3))
  if (shape === 'circle') return `<circle cx="${cx}" cy="${cy}" r="${round(r)}" ${fill}/>`
  const corner = shape === 'rounded' ? ` rx="${round(r * 0.4)}"` : ''
  return `<rect x="${round(cx - r)}" y="${round(cy - r)}" width="${round(2 * r)}" height="${round(2 * r)}"${corner} ${fill}/>`
}
