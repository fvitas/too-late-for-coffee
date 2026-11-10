import { type Dot, type DotStyle } from './dotIcons'

type DotIconProps = { dots: Dot[]; style: DotStyle; px: number; className?: string }

export function DotIcon({ dots, style, px, className = '' }: DotIconProps) {
  const side = 2 * style.grid
  return (
    <svg viewBox={`0 0 ${side} ${side}`} width={px} height={px} className={`shrink-0 ${className}`} aria-hidden>
      {dots.map(({ cx, cy, r, opacity }) =>
        style.shape === 'circle' ? (
          <circle key={`${cx}:${cy}`} cx={cx} cy={cy} r={r} fill="currentColor" fillOpacity={opacity} />
        ) : (
          <rect
            key={`${cx}:${cy}`}
            x={cx - r}
            y={cy - r}
            width={2 * r}
            height={2 * r}
            rx={style.shape === 'rounded' ? r * 0.4 : 0}
            fill="currentColor"
            fillOpacity={opacity}
          />
        ),
      )}
    </svg>
  )
}
