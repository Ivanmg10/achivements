'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useLanguage } from '@/context/LanguageContext'
import { useThemeChoice } from '@/hooks/useThemeChoice'
import type { Theme } from '@/types/types'
import { lookTransition, spreadFrom } from '@/utils/lookTransition'
import ThemeModalPicker from './theme-modal-picker/ThemeModalPicker'

interface Props {
  isOpen: boolean
  onClose: () => void
}

/**
 * Every theme, as a base and an option under it. A pick spreads over the whole page from its card and
 * the dialog stays open, so themes can be compared; the line under the title
 * says which one is on and when it has been saved. A failed save brings the
 * old one back and says so here. No blur behind it: the whole page has to take
 * part in the spread, and Firefox would drop the blur for as long as it lasts.
 */
export default function ThemeModal({ isOpen, onClose }: Props) {
  const { theme, choose, saveError } = useThemeChoice()
  const { T } = useLanguage()
  const [savedTheme, setSavedTheme] = useState<Theme | null>(null)

  function pick(id: Theme, from: Element) {
    if (id === theme) return
    setSavedTheme(null)
    const box = from.getBoundingClientRect()
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
      size="2xl"
      backdrop="dim"
      title={T.userTheme.theme}
      hint={<span role="status">{savedTheme === theme ? `${name} · ${T.toast.saved}` : name}</span>}
    >
      <ThemeModalPicker theme={theme} onSelect={pick} />
      {saveError && (
        <p role="alert" className="text-sm text-danger">
          {T.userTheme.saveError}
        </p>
      )}
    </Modal>
  )
}
