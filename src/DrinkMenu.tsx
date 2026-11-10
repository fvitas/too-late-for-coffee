import { type Cup, CUSTOM_RANGE_MG, DRINKS } from './caffeine'
import { Icon } from './Icon'

type DrinkMenuProps = {
  cup: Cup
  onPick: (mg: number) => void
  onCustom: (mg: number) => void
}

const CUSTOM_PATTERN = /^\d{1,3}$/

export function DrinkMenu({ cup, onPick, onCustom }: DrinkMenuProps) {
  const custom = !DRINKS.some((drink) => drink.mg === cup.mg)

  function customMg(value: string): number | null {
    if (!CUSTOM_PATTERN.test(value)) return null
    return Math.min(CUSTOM_RANGE_MG[1], Math.max(CUSTOM_RANGE_MG[0], Number(value)))
  }

  function handleInput(event: React.FormEvent<HTMLInputElement>) {
    const mg = customMg(event.currentTarget.value)
    if (mg === null) return
    // The field shows the clamped amount, so it always matches the cup.
    event.currentTarget.value = String(mg)
    onCustom(mg)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const mg = customMg(new FormData(event.currentTarget).get('mg')?.toString() ?? '')
    if (mg !== null) onPick(mg)
  }

  return (
    <div role="menu" className="flex w-[16em] flex-col rounded-md border border-line bg-paper p-1 shadow-lg shadow-shade">
      {DRINKS.map((drink) => {
        const active = cup.mg === drink.mg
        return (
          <button
            key={drink.icon}
            type="button"
            role="menuitemradio"
            aria-checked={active}
            className={`flex min-h-10 cursor-pointer items-center gap-2 px-3 whitespace-nowrap transition-colors sm:min-h-8 ${active ? 'text-accent' : 'text-muted hover:text-bright focus-visible:text-bright'}`}
            onClick={() => onPick(drink.mg)}
          >
            <Icon icon={drink.icon} className="size-5" />
            <span className="flex-1 text-left">{drink.name}</span>
            {drink.mg}
          </button>
        )
      })}
      <form
        className={`flex min-h-10 items-center gap-2 px-3 whitespace-nowrap sm:min-h-8 ${custom ? 'text-accent' : 'text-muted'}`}
        onSubmit={handleSubmit}
      >
        <Icon icon="cup" className="size-5" />
        <label htmlFor="custom-mg" className="flex-1">
          CUSTOM
        </label>
        <input
          id="custom-mg"
          name="mg"
          type="text"
          inputMode="numeric"
          maxLength={3}
          placeholder={`${CUSTOM_RANGE_MG[0]}-${CUSTOM_RANGE_MG[1]}`}
          defaultValue={custom ? String(cup.mg) : undefined}
          className="w-[6ch] rounded-md border border-line bg-transparent px-1 text-right text-bright placeholder:text-faint"
          onInput={handleInput}
        />
      </form>
    </div>
  )
}
