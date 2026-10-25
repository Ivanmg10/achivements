'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { InsightAchievement } from '@/utils/gameInsights'
import LibraryDetailList from '@/components/library-game-detail/library-detail-list/LibraryDetailList'
import Modal from '@/components/ui/Modal'

/**
 * What was unlocked in the week or month clicked on a game's chart, newest
 * first, each a link to the achievement. On `<body>`, so the opened card's
 * animation does not position or clip it.
 */
export default function GameAchievementsProgressChartModal({
  isOpen,
  title,
  items,
  onClose,
}: {
  isOpen: boolean
  title: string
  items: InsightAchievement[]
  onClose: () => void
}) {
  const { T, lang } = useLanguage()
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const sorted = [...items].sort((a, b) => (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''))

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} aria-labelledby={titleId} size="md" showClose={false} className="gap-3">
            <div className="flex items-start justify-between gap-2 shrink-0">
              <p id={titleId} className="text-sm font-semibold text-text-main first-letter:uppercase">
                {title}
              </p>
              <button
                onClick={onClose}
                aria-label={T.cards.close}
                className="text-text-secondary hover:text-text-main transition-colors mt-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconX size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              <LibraryDetailList
                title={`${items.length} ${T.dayModal.achievements}`}
                items={sorted}
                empty={T.gameExpanded.noActivity}
                meta={(a) => a.earnedAt && <span>{new Date(a.earnedAt.replace(' ', 'T')).toLocaleDateString(lang)}</span>}
              />
            </div>
          </Modal>
      )}
    </AnimatePresence>,
    document.body,
  )
}
