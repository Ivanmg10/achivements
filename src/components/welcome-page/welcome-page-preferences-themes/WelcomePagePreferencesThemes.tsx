import { useState, type MouseEvent } from 'react'
import dynamic from 'next/dynamic'
import { useThemeChoice } from '@/hooks/useThemeChoice'
import { useLanguage } from '@/context/LanguageContext'
import type { Theme } from '@/types/types'
import { lookTransition, spreadFrom } from '@/utils/lookTransition'
import ThemeModalOption from '@/components/theme-modal/theme-modal-option/ThemeModalOption'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import { QUIET_BUTTON } from '@/components/welcome-page/welcomeArt'

const ThemeModal = dynamic(() => import('@/components/theme-modal/ThemeModal'), { loading: () => null })

/** A short pick of the themes, dark ones with distinct accents; the rest are one click away. */
const FEATURED_THEMES: Theme[] = ['dark', 'dark-red', 'dark-blue', 'midnight', 'black-ops-2', 'steam-retro', 'snake-eater', 'venom']

/** The theme, spreading over the whole welcome from the tile picked, as in `ThemeModal`, and saved on the account. */
export default function WelcomePagePreferencesThemes() {
  const { T } = useLanguage()
  const { theme, choose, saveError } = useThemeChoice()
  const [allThemes, setAllThemes] = useState(false)

  function pick(id: Theme, e: MouseEvent<HTMLButtonElement>) {
    if (id === theme) return
    const box = e.currentTarget.getBoundingClientRect()
    lookTransition(() => void choose(id), spreadFrom(box.left + box.width / 2, box.top + box.height / 2))
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label={T.userTheme.theme} className="grid grid-cols-4 gap-1.5">
        {FEATURED_THEMES.map((id) => (
          <ThemeModalOption key={id} theme={id} checked={theme === id} onSelect={pick} />
        ))}
      </div>
      {saveError && (
        <p role="alert" className="text-sm text-danger">{T.userTheme.saveError}</p>
      )}
      <button type="button" onClick={() => setAllThemes(true)} className={`${QUIET_BUTTON} self-start -ml-2`}>
        {T.welcome.prefs.allThemes}
      </button>

      <LazyWhenOpened open={allThemes}>
        <ThemeModal isOpen={allThemes} onClose={() => setAllThemes(false)} />
      </LazyWhenOpened>
    </div>
  )
}
