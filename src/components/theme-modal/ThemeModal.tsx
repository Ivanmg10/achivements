'use client'

import { useSession } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { Theme } from '@/types/types'

const THEMES: { id: Theme; label: string; cls: string }[] = [
  { id: 'dark',   label: 'Dark',   cls: 'button-dark'   },
  { id: 'light',  label: 'Light',  cls: 'button-light'  },
  { id: 'blue',   label: 'Blue',   cls: 'button-blue'   },
  { id: 'purple', label: 'Purple', cls: 'button-purple' },
  { id: 'red',    label: 'Red',    cls: 'button-red'    },
  { id: 'green',  label: 'Green',  cls: 'button-green'  },
  { id: 'yellow', label: 'Yellow', cls: 'button-yellow' },
  { id: 'teal',   label: 'Teal',   cls: 'button-teal'   },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ThemeModal({ isOpen, onClose }: Props) {
  const { theme, setTheme } = useTheme()
  const { update } = useSession()
  const { T } = useLanguage()

  const handleSelect = async (id: Theme) => {
    setTheme(id)
    await fetch('/api/updateTheme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: id }),
    })
    await update({ theme: id })
    onClose()
  }

  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold">{T.userTheme.theme}</h2>
      <div role="radiogroup" aria-label={T.userTheme.theme} className="grid grid-cols-2 gap-3">
        {THEMES.map(({ id, label, cls }) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            role="radio"
            aria-checked={theme === id}
            className={`${cls} py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-between gap-2`}
          >
            {label}
            {theme === id && <span className="w-2 h-2 rounded-full bg-current opacity-80" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </CommonModal>
  )
}
