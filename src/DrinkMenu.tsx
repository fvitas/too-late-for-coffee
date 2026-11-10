import { type Cup, DRINKS } from './caffeine'
import { DrinkIcon } from './DrinkIcon'

type DrinkMenuProps = {
  cup: Cup
  onPick: (mg: number) => void
}

export function DrinkMenu({ cup, onPick }: DrinkMenuProps) {
  return (
    <div role="menu" className="flex w-[16em] flex-col border border-[#1f1f1f] bg-[#0e0e0e] p-1 shadow-lg shadow-black">
      {DRINKS.map((drink) => {
        const active = cup.mg === drink.mg
        return (
          <button
            key={drink.icon}
            type="button"
            role="menuitemradio"
            aria-checked={active}
            className={`flex min-h-10 cursor-pointer items-center gap-2 px-3 whitespace-nowrap transition-colors focus-visible:outline-none sm:min-h-8 ${active ? 'text-[#3b82f6]' : 'text-[#757575] hover:text-[#f2f2f2] focus-visible:text-[#f2f2f2]'}`}
            onClick={() => onPick(drink.mg)}
          >
            <DrinkIcon icon={drink.icon} className="size-5" />
            <span className="flex-1 text-left">{drink.name}</span>
            {drink.mg}
          </button>
        )
      })}
    </div>
  )
}
