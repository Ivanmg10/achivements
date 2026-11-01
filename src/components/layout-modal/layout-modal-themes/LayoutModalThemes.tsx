'use client'

import { useState, type MouseEvent } from 'react'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import { useThemeChoice } from '@/hooks/useThemeChoice'
import { THEMES, type Theme } from '@/types/types'
import { lookTransition } from '@/utils/lookTransition'
import Button from '@/components/ui/Button'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'

const ThemeModal = dynamic(() => import('@/components/theme-modal/ThemeModal'), { loading: () => null })

const SHORTLIST: Theme[] = ['dark', 'dark-red', 'ocean', 'black-ops-2', 'synthwave', 'light']

/**
 * A few themes as swatches, each drawn with its own tokens, beside the rest of
 * the look: picked, the theme spreads from the swatch over the whole page. The
 * person's theme is always among them, even one chosen from the full list.
 */
export default function LayoutModalThemes() {
  const { T } = useLanguage()
  const { theme, choose, saveError } = useThemeChoice()
  const [allThemes, setAllThemes] = useState(false)
  const swatches = SHORTLIST.includes(theme) ? SHORTLIST : [...SHORTLIST.slice(0, -1), theme]

  function pick(id: Theme, e: MouseEvent<HTMLButtonElement>) {
    if (id === theme) return
    const box = e.currentTarget.getBoundingClientRect()
    lookTransition(() => void choose(id), { x: box.left + box.width / 2, y: box.top + box.height / 2 })
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-text-secondary">{T.userTheme.theme}</span>
      <div role="group" aria-label={T.userTheme.theme} className="grid grid-cols-6 gap-2.5 p-1">
        {swatches.map((id) => (
          <button
            key={id}
            type="button"
            aria-label={T.userTheme[`name_${id}`]}
            aria-pressed={id === theme}
            onClick={(e) => pick(id, e)}
            className={`aspect-square cursor-pointer overflow-hidden rounded-full transition-shadow duration-(--motion-open) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              id === theme ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-header' : 'ring-1 ring-ink/15 hover:ring-ink/40'
            }`}
          >
            <span data-theme={id} aria-hidden="true" className="block h-full w-full bg-[linear-gradient(135deg,rgb(var(--bg-card))_50%,rgb(var(--accent))_50%)]" />
          </button>
        ))}
      </div>
      <p className="text-sm font-bold text-text-main">{T.userTheme[`name_${theme}`]}</p>
      <Button variant="quiet" size="sm" onClick={() => setAllThemes(true)} className="self-start -ml-2">
        {T.homeLayout.allThemes.replace('{n}', String(THEMES.length))}
      </Button>
      {saveError && (
        <p role="alert" className="text-sm text-danger">
          {T.userTheme.saveError}
        </p>
      )}

      <LazyWhenOpened open={allThemes}>
        <ThemeModal isOpen={allThemes} onClose={() => setAllThemes(false)} />
      </LazyWhenOpened>
    </div>
  )
}
