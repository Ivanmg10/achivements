'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { InsightAchievement } from '@/utils/gameInsights'
import LibraryDetailList from '@/components/library-game-detail/library-detail-list/LibraryDetailList'
import Modal from '@/components/ui/Modal'
import DateText from '@/components/ui/DateText'

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
  const { T } = useLanguage()

  const sorted = [...items].sort((a, b) => (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''))

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={title.charAt(0).toUpperCase() + title.slice(1)} className="gap-3">
      <LibraryDetailList
        title={`${items.length} ${T.dayModal.achievements}`}
        items={sorted}
        empty={T.gameExpanded.noActivity}
        meta={(a) => <DateText value={a.earnedAt} />}
      />
    </Modal>
  )
}
