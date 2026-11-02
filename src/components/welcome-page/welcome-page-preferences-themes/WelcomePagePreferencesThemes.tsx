import type { MouseEvent } from 'react'
import { useThemeChoice } from '@/hooks/useThemeChoice'
import { useLanguage } from '@/context/LanguageContext'
import type { Theme } from '@/types/types'
import { lookTransition, spreadFrom } from '@/utils/lookTransition'
import ThemeModalGroups from '@/components/theme-modal/theme-modal-groups/ThemeModalGroups'

/** Every theme, spreading over the whole welcome from the tile picked, as in `ThemeModal`, and saved on the account. */
export default function WelcomePagePreferencesThemes() {
  const { T } = useLanguage()
  const { theme, choose, saveError } = useThemeChoice()

  function pick(id: Theme, e: MouseEvent<HTMLButtonElement>) {
    if (id === theme) return
    const box = e.currentTarget.getBoundingClientRect()
    lookTransition(() => void choose(id), spreadFrom(box.left + box.width / 2, box.top + box.height / 2))
  }

  return (
    <div className="flex flex-col gap-2">
      {saveError && (
        <p role="alert" className="text-sm text-danger">{T.userTheme.saveError}</p>
      )}
      <ThemeModalGroups theme={theme} onSelect={pick} columns="grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 xl:grid-cols-5" />
    </div>
  )
}
