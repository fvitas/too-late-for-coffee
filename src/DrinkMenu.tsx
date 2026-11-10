import { type Cup, DRINKS } from './caffeine'
import { Icon } from './Icon'

type DrinkMenuProps = {
  cup: Cup
  onPick: (mg: number) => void
}

export function DrinkMenu({ cup, onPick }: DrinkMenuProps) {
  return (
    <div role="menu" className="flex w-[16em] flex-col border border-line bg-paper p-1 shadow-lg shadow-shade">
      {DRINKS.map((drink) => {
        const active = cup.mg === drink.mg
        return (
          <button
            key={drink.icon}
            type="button"
            role="menuitemradio"
            aria-checked={active}
            className={`flex min-h-10 cursor-pointer items-center gap-2 px-3 whitespace-nowrap transition-colors focus-visible:outline-none sm:min-h-8 ${active ? 'text-accent' : 'text-muted hover:text-bright focus-visible:text-bright'}`}
            onClick={() => onPick(drink.mg)}
          >
            <Icon icon={drink.icon} className="size-5" />
            <span className="flex-1 text-left">{drink.name}</span>
            {drink.mg}
          </button>
        )
      })}
    </div>
  )
}
