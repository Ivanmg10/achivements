import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { Theme } from '@/types/types'
import ThemePreview from '@/components/theme-preview/ThemePreview'

/** One theme in the picker: its miniature and its name, ticked when current. */
export default function ThemeModalOption({ theme, checked, onSelect }: { theme: Theme; checked: boolean; onSelect: (theme: Theme) => void }) {
  const { T } = useLanguage()

  return (
    <button
      onClick={() => onSelect(theme)}
      role="radio"
      aria-checked={checked}
      className={`theme-button rounded-xl p-2 border-2 transition-all text-left ${
        checked ? 'border-accent ring-2 ring-accent/30' : 'border-bg-header hover:border-accent/50'
      }`}
    >
      <ThemePreview theme={theme} />
      <span className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-text-main">
        {checked && <IconCheck size={12} aria-hidden="true" />}
        {T.userTheme[`name_${theme}`]}
      </span>
    </button>
  )
}
