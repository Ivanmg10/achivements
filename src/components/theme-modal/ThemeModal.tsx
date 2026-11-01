'use client'

import { useState, type MouseEvent } from 'react'
import Modal from '@/components/ui/Modal'
import { useLanguage } from '@/context/LanguageContext'
import { useThemeChoice } from '@/hooks/useThemeChoice'
import { Theme, THEME_GROUPS } from '@/types/types'
import { lookTransition, spreadFrom } from '@/utils/lookTransition'
import ThemeModalOption from './theme-modal-option/ThemeModalOption'

interface Props {
  isOpen: boolean
  onClose: () => void
}

/**
 * Every theme by family. A pick spreads over the whole page from its tile and
 * the dialog stays open, so themes can be compared; the line under the title
 * says which one is on and when it has been saved. A failed save brings the
 * old one back and says so here.
 */
export default function ThemeModal({ isOpen, onClose }: Props) {
  const { theme, choose, saveError } = useThemeChoice()
  const { T } = useLanguage()
  const [savedTheme, setSavedTheme] = useState<Theme | null>(null)

  function pick(id: Theme, e: MouseEvent<HTMLButtonElement>) {
    if (id === theme) return
    setSavedTheme(null)
    const box = e.currentTarget.getBoundingClientRect()
    lookTransition(
      () => void choose(id).then((saved) => setSavedTheme(saved ? id : null)),
      spreadFrom(box.left + box.width / 2, box.top + box.height / 2),
    )
  }

  const name = T.userTheme[`name_${theme}`]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={T.userTheme.theme}
      hint={<span role="status">{savedTheme === theme ? `${name} · ${T.toast.saved}` : name}</span>}
    >
      <div role="radiogroup" aria-label={T.userTheme.theme} className="flex flex-col gap-5">
        {THEME_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`theme-group-${group.id}`} className="flex flex-col gap-2">
            <h3 id={`theme-group-${group.id}`} className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              {T.userTheme[`group_${group.id}`]}
            </h3>
            {/* One grid for every group, so the previews are the same size throughout. In threes the
                base themes sit a row of dark over a row of light; in sixes, all on one row. */}
            <div className="grid grid-cols-2 min-[400px]:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {group.themes.map((id) => (
                <ThemeModalOption key={id} theme={id} checked={theme === id} onSelect={pick} />
              ))}
            </div>
          </section>
        ))}
      </div>
      {saveError && (
        <p role="alert" className="text-sm text-danger">
          {T.userTheme.saveError}
        </p>
      )}
    </Modal>
  )
}
