'use client'

import { useMemo } from 'react'
import { IconNotebook } from '@tabler/icons-react'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { activityJournal } from '@/utils/activityInsights'
import { SkeletonGameList } from '@/components/ui/SkeletonList'
import EmptyState from '@/components/empty-state/EmptyState'
import MainPageJournalDay from '../main-page-journal-day/MainPageJournalDay'

// Three days of at most two games: as tall as the lists beside it.
const DAYS = 3

/** The last days with unlocks, each with the games played and how much: a diary of what was done. */
export default function MainPageJournal({ achievements, isLoading }: { achievements: RecentAchievement[]; isLoading?: boolean }) {
  const { T } = useLanguage()
  const days = useMemo(() => activityJournal(achievements, DAYS), [achievements])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.journal}</p>
      {isLoading ? (
        <SkeletonGameList count={7} />
      ) : days.length === 0 ? (
        <EmptyState icon={<IconNotebook className="w-6 h-6" />} title={T.cards.noData} size="compact" className="py-2" />
      ) : (
        <ol className="flex flex-col gap-3">
          {days.map((d) => (
            <li key={d.day}>
              <MainPageJournalDay day={d} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
