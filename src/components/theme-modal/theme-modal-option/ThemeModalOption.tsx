import type { MouseEvent } from 'react'
import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { Theme } from '@/types/types'
import ThemePreview from '@/components/theme-preview/ThemePreview'

/** One theme in the picker: its miniature and its name, ticked on the miniature when current, so a tick never wraps the name. */
export default function ThemeModalOption({ theme, checked, onSelect }: { theme: Theme; checked: boolean; onSelect: (theme: Theme, e: MouseEvent<HTMLButtonElement>) => void }) {
  const { T } = useLanguage()

  return (
    <button
      onClick={(e) => onSelect(theme, e)}
      role="radio"
      aria-checked={checked}
      className={`theme-button relative rounded-tile p-2 border-2 transition-all text-left ${
        checked ? 'border-accent ring-2 ring-accent/30' : 'border-bg-header hover:border-accent/50'
      }`}
    >
      <ThemePreview theme={theme} />
      {checked && (
        <span aria-hidden="true" className="absolute right-3 bottom-10 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-bg-main ring-2 ring-bg-header">
          <IconCheck size={12} stroke={3} />
        </span>
      )}
      <span className="mt-2 block text-center text-xs font-medium text-text-main">{T.userTheme[`name_${theme}`]}</span>
    </button>
  )
}
