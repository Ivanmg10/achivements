import { useId, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { fieldClass } from '@/components/ui/Input'

/** The icons offered in one tap, by category. Anything else goes in the field below them. */
export const ICON_CATEGORIES = {
  iconGames: ['🎮', '🕹️', '👾', '🎲', '🧩', '♟️', '🃏', '🎯', '🎳', '🏁', '🚀', '🛸', '🤖', '👻', '🐉', '⚔️'],
  iconTrophies: ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '⭐', '🌟', '✨', '💎', '👑', '💯', '🔥', '⚡', '💪', '✅'],
  iconMoods: ['❤️', '💀', '😈', '😎', '🥶', '😱', '🤯', '😴', '🧠', '👀', '🙌', '🎉', '💔', '🌈', '☠️', '🫡'],
  iconLists: ['📅', '⏳', '⌛', '🕐', '📌', '📚', '📖', '📝', '🗂️', '📦', '🎒', '🗺️', '🧭', '🔖', '🏷️', '📁'],
  iconNature: ['🌙', '☀️', '🌊', '🌲', '🍄', '🌸', '🐱', '🐶', '🦊', '🐸', '🐢', '🦔', '🐧', '🦄', '🐲', '🌋'],
} as const
type Category = keyof typeof ICON_CATEGORIES
const CATEGORIES = Object.keys(ICON_CATEGORIES) as Category[]
const ALL: readonly string[] = Object.values(ICON_CATEGORIES).flat()

const SWATCH = 'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'
const TAB = 'h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * A group's icon: a category of common ones to pick in one tap, none, or the
 * user's own emoji or image link. Opens on the category of the current icon.
 */
export default function GroupModalIconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const { T } = useLanguage()
  const customId = useId()
  const current = value.trim()
  const [category, setCategory] = useState<Category>(() => CATEGORIES.find((c) => (ICON_CATEGORIES[c] as readonly string[]).includes(current)) ?? 'iconGames')

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[10px] uppercase tracking-widest text-text-secondary mb-2">{T.groups.icon}</legend>

      <div role="group" aria-label={T.groups.icon} className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`${TAB} ${category === c ? 'bg-text-main text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
          >
            {T.groups[c]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          aria-pressed={current === ''}
          aria-label={T.groups.noIcon}
          onClick={() => onChange('')}
          className={`${SWATCH} text-xs text-text-secondary ${current === '' ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg-main hover:bg-ink/10'}`}
        >
          —
        </button>
        {ICON_CATEGORIES[category].map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-pressed={current === emoji}
            aria-label={emoji}
            onClick={() => onChange(emoji)}
            className={`${SWATCH} ${current === emoji ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg-main hover:bg-ink/10'}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <label htmlFor={customId} className="sr-only">{T.groups.customIcon}</label>
      <input
        id={customId}
        value={ALL.includes(current) ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={T.groups.customIcon}
        className={fieldClass({ size: 'sm' })}
      />
    </fieldset>
  )
}
