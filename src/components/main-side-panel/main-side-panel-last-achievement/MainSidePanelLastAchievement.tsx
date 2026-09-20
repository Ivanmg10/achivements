import { RecentAchievement } from '@/types/types'
import Image from 'next/image'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import EmptyState from '@/components/empty-state/EmptyState'

export default function MainSidePanelLastAchievement({
  achievement,
  isLoading,
}: {
  achievement: RecentAchievement | null
  isLoading?: boolean
}) {
  const { T } = useLanguage()

  if (isLoading && !achievement) {
    return (
      <section className="w-[90%] bg-bg-main rounded-2xl p-3 flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="h-2.5 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-2.5 bg-white/10 rounded w-1/4" />
        </div>
      </section>
    )
  }

  if (!achievement) {
    return (
      <section className="w-[90%] bg-bg-main rounded-2xl p-3">
        <EmptyState icon={<IconTrophy className="w-5 h-5" />} title={T.cards.noEarned} size="compact" />
      </section>
    )
  }

  return (
    <section className="w-[90%] bg-bg-main rounded-2xl p-3 flex items-center gap-3">
      {achievement.BadgeName ? (
        <Image
          src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
          alt={achievement.Title}
          width={40}
          height={40}
          className="rounded-lg shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs text-text-secondary truncate">{achievement.GameTitle}</p>
        <p className="text-sm font-medium truncate">{achievement.Title}</p>
        <p className="text-xs text-accent">{achievement.Points} pts</p>
      </div>
    </section>
  )
}
