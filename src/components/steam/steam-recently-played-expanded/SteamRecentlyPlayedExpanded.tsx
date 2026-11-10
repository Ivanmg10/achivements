'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { fromSteam } from '@/utils/gameInsights'
import GameExpandedLayout from '@/components/game-expanded-layout/GameExpandedLayout'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'
import { SteamAchievementGrid } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import SteamExpandedStats from './steam-expanded-stats/SteamExpandedStats'
import SteamRarestAchievements from './steam-rarest-achievements/SteamRarestAchievements'
import type { SteamGameProgress } from '@/types/steam'

const SKELETON_BADGES = 24

/**
 * An opened Steam game in the recent feed: the ring with its stats on small screens, the chart and the
 * player's rarest unlocks, the full grid below. Achievements load when this mounts, i.e. when the card is
 * opened. Until then the ring uses the counts the feed already has.
 */
export default function SteamRecentlyPlayedExpanded({ game }: { game: SteamGameProgress }) {
  const { T } = useLanguage()
  const { achievements, isLoading, error, retry } = useSteamAchievements(game.id)

  const loaded = achievements.length > 0
  const total = loaded ? achievements.length : game.maxPossible
  const earned = loaded ? achievements.filter((a) => a.earned).length : game.numAwarded
  const completionPct = total > 0 ? Math.round((earned / total) * 100) : 0

  return (
    <GameExpandedLayout
      earned={earned}
      total={total}
      ringLabel={T.gameExpanded.allAchievements}
      ringExtra={
        <SteamExpandedStats
          playtimeForever={game.playtimeForever}
          playtime2Weeks={game.playtime2Weeks}
          completionPct={completionPct}
          remaining={Math.max(0, total - earned)}
        />
      }
      gridTitle={T.gameExpanded.allAchievements}
      unlocks={fromSteam(achievements, game.id)}
      isLoading={isLoading}
      side={<SteamRarestAchievements appId={game.id} achievements={achievements} isLoading={isLoading} />}
    >
      <LazyBadgeGrid
        loading={isLoading}
        count={total || SKELETON_BADGES}
        error={error ? { message: T.steam.achievementsError, hint: T.steam.privateProfileHint, retryLabel: T.steam.retry, onRetry: retry } : null}
        empty={loaded ? null : T.steam.noAchievements}
      >
        <SteamAchievementGrid appId={game.id} gameTitle={game.title} achievements={achievements} badgeSize={40} />
      </LazyBadgeGrid>
    </GameExpandedLayout>
  )
}
