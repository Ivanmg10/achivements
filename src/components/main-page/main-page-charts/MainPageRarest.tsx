'use client'

import { useMemo } from 'react'
import { IconSparkles } from '@tabler/icons-react'
import { RecentAchievement } from '@/types/types'
import type { SteamRecentAchievement } from '@/types/steam'
import type { PsnRecentTrophy } from '@/types/psn'
import type { XboxRecentAchievement } from '@/types/xbox'
import { gameHref } from '@/utils/gameRef'
import { psnTrophyAnchor } from '@/utils/psnTitles'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import { useLanguage } from '@/context/LanguageContext'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import { GameListRow } from '@/components/ui/GameListRow'
import { SkeletonGameList } from '@/components/ui/SkeletonList'
import EmptyState from '@/components/empty-state/EmptyState'
import { useSubject } from '@/context/SubjectContext'

const SHOWN = 6

type Row = { key: string; href: string; imageUrl?: string; title: string; subtitle: string; stat: string; statLabel: string }

/**
 * The rarest recent unlocks from every platform. RA ranks by TrueRatio,
 * Steam, PSN and Xbox by the share of players who have it — they do not compare
 * (different player bases), so the list takes each platform's rarest in turn,
 * each with its own measure.
 */
export default function MainPageRarest({
  achievements,
  steamAchievements = [],
  psnTrophies = [],
  xboxAchievements = [],
  isLoading,
}: {
  achievements: RecentAchievement[]
  steamAchievements?: SteamRecentAchievement[]
  psnTrophies?: PsnRecentTrophy[]
  xboxAchievements?: XboxRecentAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const subject = useSubject()
  const rows = useMemo(() => {
    const ra: Row[] = achievements
      .filter((a) => a.TrueRatio !== undefined && a.TrueRatio > a.Points)
      .sort((a, b) => (b.TrueRatio ?? 0) - (a.TrueRatio ?? 0))
      .map((a) => ({
        key: `ra:${a.AchievementID}`,
        href: a.GameID ? gameHref('ra', a.GameID, subject) : '#',
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
        href: `${gameHref('steam', a.appId, subject)}#${achievementAnchor(a.apiname)}`,
        imageUrl: a.badgeUrl || undefined,
        title: a.title,
        subtitle: a.gameTitle,
        stat: `${a.globalPct.toFixed(1)}%`,
        statLabel: T.cards.steamRarityLabel,
      }))
    const psn: Row[] = psnTrophies
      .filter((t): t is PsnRecentTrophy & { rarity: number } => typeof t.rarity === 'number')
      .sort((a, b) => a.rarity - b.rarity)
      .map((t) => ({
        key: `psn:${t.gameId}:${t.trophyId}`,
        href: `${gameHref('psn', t.gameId, subject)}#${psnTrophyAnchor(t.trophyId)}`,
        imageUrl: t.iconUrl || undefined,
        title: t.name,
        subtitle: t.gameTitle,
        stat: `${t.rarity.toFixed(1)}%`,
        statLabel: T.cards.steamRarityLabel,
      }))
    const xbox: Row[] = xboxAchievements
      .filter((a): a is XboxRecentAchievement & { rarity: number } => typeof a.rarity === 'number')
      .sort((a, b) => a.rarity - b.rarity)
      .map((a) => ({
        key: `xbox:${a.gameId}:${a.achievementId}`,
        href: `${gameHref('xbox', a.gameId, subject)}#${xboxAchievementAnchor(a.achievementId)}`,
        imageUrl: a.iconUrl || undefined,
        title: a.name,
        subtitle: a.gameTitle,
        stat: `${a.rarity.toFixed(1)}%`,
        statLabel: T.cards.steamRarityLabel,
      }))
    const lists = [ra, steam, psn, xbox]
    const merged: Row[] = []
    for (let i = 0; merged.length < SHOWN && lists.some((l) => i < l.length); i++) {
      for (const list of lists) if (i < list.length && merged.length < SHOWN) merged.push(list[i])
    }
    return merged
  }, [achievements, steamAchievements, psnTrophies, xboxAchievements, T, subject])

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
