'use client'

import { useMemo } from 'react'
import { IconActivity } from '@tabler/icons-react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { achievementGameIconUrl } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import { GameListRow } from '@/components/ui/GameListRow'
import { SkeletonGameList } from '@/components/ui/SkeletonList'
import EmptyState from '@/components/empty-state/EmptyState'

export default function MainPageTopGames({ achievements, isLoading }: { achievements: RecentAchievement[]; isLoading?: boolean }) {
  const { T } = useLanguage()
  const data = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const byGame = achievements
      .filter((a) => a.Date.split(' ')[0] >= cutoffStr)
      .reduce((acc, a) => {
        // RA game ids and Steam appids share a number space: key by both.
        const key = `${a.Source ?? 'ra'}:${a.GameID}`
        if (!acc[key]) {
          acc[key] = { count: 0, name: a.GameTitle, href: gameHref(a.Source ?? 'ra', a.GameID), icon: achievementGameIconUrl(a), console: a.ConsoleName }
        }
        acc[key].count++
        return acc
      }, {} as Record<string, { count: number; name: string; href: string; icon?: string; console?: string }>)

    return Object.values(byGame)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [achievements])

  if (isLoading) return <SkeletonGameList count={4} />

  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.mostActiveGames}</p>
        <EmptyState icon={<IconActivity className="w-6 h-6" />} title={T.cards.noData} size="compact" className="py-2" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 flex-1">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.mostActiveGames}</p>
      <div className="flex flex-col gap-2 flex-1">
        {data.map(({ name, count, href, icon, console: con }) => (
          <GameListRow
            key={href}
            href={href}
            imageUrl={icon}
            imageAlt={name}
            title={name}
            subtitle={con}
            stat={String(count)}
            statLabel={T.lineChart.achievements}
            statClassName="text-accent"
          />
        ))}
      </div>
    </div>
  )
}
