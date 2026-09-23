'use client'

import { useMemo } from 'react'
import { IconSparkles } from '@tabler/icons-react'
import { RecentAchievement } from '@/types/types'
import type { SteamRecentAchievement } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import { GameListRow } from '@/components/ui/GameListRow'
import { SkeletonGameList } from '@/components/ui/SkeletonList'
import EmptyState from '@/components/empty-state/EmptyState'

const SHOWN = 6

type Row = { key: string; href: string; imageUrl?: string; title: string; subtitle: string; stat: string; statLabel: string }

/**
 * The rarest recent unlocks from both platforms. RA ranks by TrueRatio and
 * Steam by the share of players who have it — the two do not compare, so the
 * list alternates between each platform's rarest, each with its own measure.
 */
export default function MainPageRarest({
  achievements,
  steamAchievements = [],
  isLoading,
}: {
  achievements: RecentAchievement[]
  steamAchievements?: SteamRecentAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const rows = useMemo(() => {
    const ra: Row[] = achievements
      .filter((a) => a.TrueRatio !== undefined && a.TrueRatio > a.Points)
      .sort((a, b) => (b.TrueRatio ?? 0) - (a.TrueRatio ?? 0))
      .map((a) => ({
        key: `ra:${a.AchievementID}`,
        href: a.GameID ? `/gameInfo/${a.GameID}` : '#',
        imageUrl: `https://media.retroachievements.org/Badge/${a.BadgeName}.png`,
        title: a.Title,
        subtitle: a.GameTitle,
        stat: String(a.TrueRatio),
        statLabel: T.cards.trueRatio,
      }))
    const steam: Row[] = steamAchievements
      .filter((a): a is SteamRecentAchievement & { globalPct: number } => typeof a.globalPct === 'number')
      .sort((a, b) => a.globalPct - b.globalPct)
      .map((a) => ({
        key: `steam:${a.appId}:${a.apiname}`,
        href: `/steamGame/${a.appId}#${achievementAnchor(a.apiname)}`,
        imageUrl: a.badgeUrl || undefined,
        title: a.title,
        subtitle: a.gameTitle,
        stat: `${a.globalPct.toFixed(1)}%`,
        statLabel: T.cards.steamRarityLabel,
      }))
    const merged: Row[] = []
    for (let i = 0; merged.length < SHOWN && (i < ra.length || i < steam.length); i++) {
      if (i < ra.length) merged.push(ra[i])
      if (i < steam.length && merged.length < SHOWN) merged.push(steam[i])
    }
    return merged
  }, [achievements, steamAchievements, T])

  if (isLoading) return <SkeletonGameList count={4} />

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-2 h-full">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.rarestUnlocks}</p>
        <EmptyState
          icon={<IconSparkles className="w-6 h-6" />}
          title={T.cards.noRarityData}
          subtitle={T.cards.noRarityDataSub}
          size="compact"
          className="flex-1"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 flex-1">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.rarestUnlocks}</p>
      <div className="flex flex-col gap-2 flex-1">
        {rows.map(({ key, ...row }) => (
          <GameListRow key={key} {...row} imageAlt={row.title} statClassName="text-yellow-400" />
        ))}
      </div>
    </div>
  )
}
