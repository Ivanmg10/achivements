'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { Theme, THEME_GROUPS } from '@/types/types'
import { notify } from '@/lib/notify'
import ThemeModalOption from './theme-modal-option/ThemeModalOption'

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
      <h2 className="text-xl font-bold">{T.userTheme.theme}</h2>
      <div role="radiogroup" aria-label={T.userTheme.theme} className="flex flex-col gap-5">
        {THEME_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`theme-group-${group.id}`} className="flex flex-col gap-2">
            <h3 id={`theme-group-${group.id}`} className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              {T.userTheme[`group_${group.id}`]}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.themes.map((id) => (
                <ThemeModalOption key={id} theme={id} checked={theme === id} onSelect={handleSelect} />
              ))}
            </div>
          </section>
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