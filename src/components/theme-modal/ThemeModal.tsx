'use client'

import { useSession } from 'next-auth/react'
import CommonModal from '../common-modal/CommonModal'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { Theme } from '@/types/types'

const THEMES: {
  id: Theme
  label: string
  bgColor: string
  textColor: string
  accentColor: string
}[] = [
  { id: 'dark',    label: 'Dark',    bgColor: 'rgb(15 16 20)',   textColor: 'rgb(225 228 235)', accentColor: 'rgb(180 185 200)'   },
  { id: 'light',   label: 'Light',   bgColor: 'rgb(238 240 244)', textColor: 'rgb(50 52 58)',   accentColor: 'rgb(70 75 85)'     },
  { id: 'blue',    label: 'Blue',   bgColor: 'rgb(10 15 28)',   textColor: 'rgb(218 228 245)', accentColor: 'rgb(59 130 246)'  },
  { id: 'purple',  label: 'Purple', bgColor: 'rgb(18 12 32)',   textColor: 'rgb(225 220 242)', accentColor: 'rgb(168 85 247)'  },
  { id: 'green',   label: 'Green',  bgColor: 'rgb(10 18 10)',   textColor: 'rgb(212 224 212)', accentColor: 'rgb(132 184 80)'  },
  { id: 'red',     label: 'Red',    bgColor: 'rgb(28 12 14)',   textColor: 'rgb(248 232 232)', accentColor: 'rgb(224 60 80)'  },
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
      <h2 className="text-xl font-bold mb-4">{T.userTheme.theme}</h2>
      <div
        role="radiogroup"
        aria-label={T.userTheme.theme}
        className="grid grid-cols-2 gap-4"
      >
        {THEMES.map(({ id, label, bgColor, textColor, accentColor }) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            role="radio"
            aria-checked={theme === id}
            className={`theme-button rounded-xl p-3 border-2 transition-all ${
              theme === id
                ? 'border-accent ring-2 ring-accent/30'
                : 'border-bg-header hover:border-accent/50'
            }`}
          >
            <div
              className="rounded-lg p-3 flex flex-col gap-2"
              style={{ backgroundColor: bgColor }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: textColor, opacity: 0.9 }}>Sample</span>
                <span className="text-[10px]" style={{ color: textColor, opacity: 0.5 }}>Text</span>
              </div>
              <div
                className="h-6 rounded-md"
                style={{ backgroundColor: accentColor, opacity: 0.3 }}
              />
              <div className="flex gap-1.5">
                <div
                  className="h-5 flex-1 rounded"
                  style={{ backgroundColor: accentColor, opacity: 0.5 }}
                />
                <div
                  className="h-5 w-5 rounded"
                  style={{ backgroundColor: accentColor, opacity: 0.3 }}
                />
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs font-medium text-text-main">{label}</span>
            </div>
          </button>
        ))}
      </div>
    </CommonModal>
  )
}