import type { MouseEvent } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { THEME_GROUPS, type Theme } from '@/types/types'
import ThemeModalOption from '@/components/theme-modal/theme-modal-option/ThemeModalOption'

/**
 * Every theme by family, as one radio group. One grid for every family, so the
 * previews are the same size throughout; `columns` is its count, as the room
 * asks (in threes the base themes sit a row of dark over a row of light).
 */
export default function ThemeModalGroups({
  theme,
  onSelect,
  columns,
}: {
  theme: Theme
  onSelect: (theme: Theme, e: MouseEvent<HTMLButtonElement>) => void
  columns: string
}) {
  const { T } = useLanguage()

  return (
    <div role="radiogroup" aria-label={T.userTheme.theme} className="flex flex-col gap-5">
      {THEME_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`theme-group-${group.id}`} className="flex flex-col gap-2">
          <h3 id={`theme-group-${group.id}`} className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {T.userTheme[`group_${group.id}`]}
          </h3>
          <div className={`grid ${columns} gap-2 sm:gap-3`}>
            {group.themes.map((id) => (
              <ThemeModalOption key={id} theme={id} checked={theme === id} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
