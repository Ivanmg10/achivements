'use client'

import { useEffect } from 'react'
import { IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import CommonModal from '@/components/common-modal/CommonModal'

/** How Vault Points are worked out, in plain words, and that the rankings are a beta. */
export default function RankingsPageHow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <CommonModal isOpen={isOpen} onClose={onClose} className="max-w-lg! min-h-0! justify-start!">
      <div role="dialog" aria-modal="true" aria-labelledby="rankings-how-title" className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h2 id="rankings-how-title" className="text-lg font-bold">{T.rankings.howTitle}</h2>
          <button
            onClick={onClose}
            aria-label={T.rankings.howClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-main hover:bg-ink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconX size={18} aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-2.5 list-disc pl-5 marker:text-accent">
          {T.rankings.howItems.map((item) => (
            <li key={item} className="text-sm text-text-secondary leading-relaxed">{item}</li>
          ))}
        </ul>
        <p className="text-xs text-text-secondary bg-bg-main rounded-xl px-3 py-2">{T.rankings.betaNote}</p>
      </div>
    </CommonModal>
  )
}
