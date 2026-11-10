import { type DrinkIconName } from './caffeine'
import caffeinePill from './assets/drinks/caffeine-pill.svg'
import cup from './assets/drinks/cup.svg'
import espresso from './assets/drinks/espresso.svg'
import matcha from './assets/drinks/matcha.svg'
import pourOver from './assets/drinks/pour-over.svg'
import tea from './assets/drinks/tea.svg'

const SOURCES: Record<DrinkIconName, string> = {
  espresso,
  'pour-over': pourOver,
  matcha,
  tea,
  'caffeine-pill': caffeinePill,
  cup,
}

type DrinkIconProps = { icon: DrinkIconName; className?: string; style?: React.CSSProperties }

// The SVG is a mask, so the icon takes the text colour.
export function DrinkIcon({ icon, className = '', style }: DrinkIconProps) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current mask-contain mask-center mask-no-repeat ${className}`}
      style={{ ...style, maskImage: `url("${SOURCES[icon]}")` }}
    />
  )
}
