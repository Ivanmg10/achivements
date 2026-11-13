'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useLandingSampleAchievements } from '@/hooks/useLandingSampleAchievements'
import { fromSteam } from '@/utils/gameInsights'
import { formatRarity } from '@/utils/steamFeed'
import { formatDate } from '@/utils/dates'
import GameExpandedLayout from '@/components/game-expanded-layout/GameExpandedLayout'
import SteamExpandedStats from '@/components/steam/steam-recently-played-expanded/steam-expanded-stats/SteamExpandedStats'
import RarestEarned from '@/components/rarest-earned/RarestEarned'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'
import BadgeGrid from '@/components/badge-grid/BadgeGrid'
import BadgeRarity from '@/components/badge-grid/badge-tip-parts/BadgeRarity'
import BadgeEarnedChip from '@/components/badge-grid/badge-tip-parts/BadgeEarnedChip'
import type { SteamAchievementUnified } from '@/types/steam'

/**
 * An example Steam game opened in the landing's library, drawn as the home feed draws one (`SteamRecentlyPlayedExpanded`):
 * the ring with the play time, the unlocks over time, the rarest earned and every achievement in the badge grid, with
 * the same pieces, from the sample's data. Nothing in it links: it is an example.
 */
export default function LandingSampleExpanded({
  appId,
  total,
  minutes,
  recentMinutes = 0,
}: {
  appId: number
  total: number
  minutes: number
  recentMinutes?: number
}) {
  const { T, lang } = useLanguage()
  const { achievements, isLoading, error, retry } = useLandingSampleAchievements(appId)
  const earned = isLoading ? 0 : achievements.filter((a) => a.earned).length
  const count = achievements.length || total

  return (
    <GameExpandedLayout
      earned={earned}
      total={count}
      ringLabel={T.gameExpanded.allAchievements}
      ringExtra={
        <SteamExpandedStats
          playtimeForever={minutes}
          playtime2Weeks={recentMinutes}
          completionPct={count > 0 ? Math.round((earned / count) * 100) : 0}
          remaining={Math.max(0, count - earned)}
        />
      }
      gridTitle={T.gameExpanded.allAchievements}
      unlocks={fromSteam(achievements, appId)}
      isLoading={isLoading}
      side={
        <RarestEarned
          title={T.steam.rarestUnlocked}
          empty={T.steam.noneUnlocked}
          isLoading={isLoading}
          ring="ring-steam"
          rows={achievements
            .filter((a): a is SteamAchievementUnified & { globalPct: number } => a.earned && a.globalPct !== null)
            .map((a) => ({
              key: a.apiname,
              name: a.title,
              icon: a.badgeUrl,
              rarity: a.globalPct,
              subline: (
                <span className="text-steam-perfect">
                  {formatRarity(a.globalPct, lang)}
                  {T.achievement.haveIt}
                </span>
              ),
            }))}
        />
      }
    >
      <LazyBadgeGrid
        loading={isLoading}
        count={count}
        size={40}
        error={error ? { message: T.steam.achievementsError, retryLabel: T.steam.retry, onRetry: retry } : null}
        empty={null}
      >
        <BadgeGrid<SteamAchievementUnified>
          items={achievements}
          keyOf={(a) => a.apiname}
          badgeSize={40}
          name={(a, concealed) => (concealed ? T.steam.hiddenAchievement : a.title)}
          label={(a, name) => `${name}, ${a.earned ? T.steam.earned : T.steam.locked}`}
          earned={(a) => a.earned}
          ring={(a) => (a.earned ? 'ring-steam' : undefined)}
          icon={(a) => a.badgeUrl}
          secret={(a) => a.hidden && !a.earned}
          keepSecretIcon
          tip={(a, concealed) => ({
            description: concealed ? T.steam.hiddenAchievementDesc : a.description,
            chips: (
              <>
                <BadgeRarity pct={a.globalPct} />
                <BadgeEarnedChip earned={a.earned} label={T.steam.earned} className="bg-steam/20 text-steam" />
              </>
            ),
            date: a.dateEarned ? formatDate(a.dateEarned, lang) : null,
          })}
        />
      </LazyBadgeGrid>
    </GameExpandedLayout>
  )
}
