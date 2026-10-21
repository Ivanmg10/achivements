import { useId } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export const ICON_PRESETS = ['🎮', '🏆', '⭐', '🔥', '🕹️', '👾', '📅', '💀', '❤️', '🎯', '🧩', '📚']

const SWATCH = 'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/** A group's icon: one tap on a common one, none, or the user's own emoji or image link. */
export default function GroupModalIconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const { T } = useLanguage()
  const customId = useId()
  const current = value.trim()

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[10px] uppercase tracking-widest text-text-secondary mb-2">{T.groups.icon}</legend>
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
        {ICON_PRESETS.map((emoji) => (
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
        value={ICON_PRESETS.includes(current) ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={T.groups.customIcon}
        className="bg-bg-main rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
      />
    </fieldset>
  )
}
