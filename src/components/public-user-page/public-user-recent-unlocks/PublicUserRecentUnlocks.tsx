'use client'

import { IconSparkles } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useStreakData } from '@/hooks/useStreakData'
import RecentAchievementRow from '@/components/recent-achievement-row/RecentAchievementRow'
import EmptyState from '@/components/empty-state/EmptyState'
import { SkeletonGameList } from '@/components/ui/SkeletonList'

const SHOWN = 8

const noop = () => {}

/** The latest unlocks from every platform, newest first; each opens the user's progress in its game. */
export default function PublicUserRecentUnlocks() {
  const { T } = useLanguage()
  const { achievements, isLoading } = useStreakData()

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-text-secondary">{T.userProfile.recentUnlocks}</h2>
      {isLoading ? (
        <SkeletonGameList count={4} />
      ) : achievements.length === 0 ? (
        <EmptyState icon={<IconSparkles className="w-6 h-6" />} title={T.userProfile.noRecentUnlocks} size="compact" />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 enter-rows">
          {achievements.slice(0, SHOWN).map((a) => (
            <li key={`${a.Source ?? 'ra'}:${a.GameID}:${a.AchievementID}:${a.Date}`} className="min-w-0">
              <RecentAchievementRow ach={a} onNavigate={noop} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
