'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { IconCheck } from '@tabler/icons-react'
import CommonModal from '../common-modal/CommonModal'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { Theme, THEMES } from '@/types/types'
import { notify } from '@/lib/notify'
import ThemePreview from '../theme-preview/ThemePreview'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ThemeModal({ isOpen, onClose }: Props) {
  const { theme, setTheme } = useTheme()
  const { update } = useSession()
  const { T } = useLanguage()
  const [saveError, setSaveError] = useState(false)

  const handleSelect = async (id: Theme) => {
    const previous = theme
    setTheme(id)
    setSaveError(false)
    try {
      const res = await fetch('/api/updateTheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: id }),
      })
      if (!res.ok) throw new Error(`updateTheme ${res.status}`)
      await update()
      notify.success(T.toast.saved)
      onClose()
    } catch (err) {
      // Not saved: put the old theme back rather than show one that will vanish on reload.
      console.error('[ThemeModal]', err)
      setTheme(previous)
      setSaveError(true)
    }
  }

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} className="mx-4 sm:max-w-2xl max-h-[90dvh] overflow-y-auto justify-start!">
      <h2 className="text-xl font-bold mb-4">{T.userTheme.theme}</h2>
      <div
        role="radiogroup"
        aria-label={T.userTheme.theme}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
      >
        {THEMES.map((id) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            role="radio"
            aria-checked={theme === id}
            className={`theme-button rounded-xl p-2 border-2 transition-all text-left ${
              theme === id
                ? 'border-accent ring-2 ring-accent/30'
                : 'border-bg-header hover:border-accent/50'
            }`}
          >
            <ThemePreview theme={id} />
            <span className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-text-main">
              {theme === id && <IconCheck size={12} aria-hidden="true" />}
              {T.userTheme[`name_${id}`]}
            </span>
          </button>
        ))}
      </div>
      {saveError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {T.userTheme.saveError}
        </p>
      )}
    </CommonModal>
  )
}