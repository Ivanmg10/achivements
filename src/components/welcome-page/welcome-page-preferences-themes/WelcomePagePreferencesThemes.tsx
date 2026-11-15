import { useThemeChoice } from '@/hooks/useThemeChoice'
import { useLanguage } from '@/context/LanguageContext'
import type { Theme } from '@/types/types'
import { lookTransition, spreadFrom } from '@/utils/lookTransition'
import ThemeModalPicker from '@/components/theme-modal/theme-modal-picker/ThemeModalPicker'

/** Every theme, spreading over the whole welcome from the card picked, as in `ThemeModal`, and saved on the account. */
export default function WelcomePagePreferencesThemes() {
  const { T } = useLanguage()
  const { theme, choose, saveError } = useThemeChoice()

  function pick(id: Theme, from: Element) {
    if (id === theme) return
    const box = from.getBoundingClientRect()
    lookTransition(() => void choose(id), spreadFrom(box.left + box.width / 2, box.top + box.height / 2))
  }

  return (
    <div className="flex flex-col gap-2">
      {saveError && (
        <p role="alert" className="text-sm text-danger">{T.userTheme.saveError}</p>
      )}
      <ThemeModalPicker theme={theme} onSelect={pick} />
    </div>
  )
}
