'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useLandingSample } from '@/hooks/useLandingSample'
import { loadSampleRaGame } from '@/components/landing-page/sample-library/landingLibrary'
import { fromRa } from '@/utils/gameInsights'
import { formatRarity } from '@/utils/steamFeed'
import { formatDate } from '@/utils/dates'
import { raBadgeUrl } from '@/utils/raAssets'
import { raTypeTag } from '@/components/ui/dataTable'
import GameExpandedLayout from '@/components/game-expanded-layout/GameExpandedLayout'
import { GameExpandedMobileStats } from '@/components/recently-played-feed/ra-recently-played-expanded/game-expanded-mobile-stats/GameExpandedMobileStats'
import RarestEarned from '@/components/rarest-earned/RarestEarned'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'
import BadgeGrid from '@/components/badge-grid/BadgeGrid'
import BadgeEarnedChip from '@/components/badge-grid/badge-tip-parts/BadgeEarnedChip'
import type { RetroAchievement } from '@/types/types'

/** Points of the achievements that pass `keep`. */
const pointsOf = (list: RetroAchievement[], keep: (a: RetroAchievement) => boolean) => list.filter(keep).reduce((sum, a) => sum + a.Points, 0)

/**
 * An RA example opened in the landing's library (`gameId`), drawn as the home feed draws one (`RaRecentlyPlayedExpanded`):
 * the ring with the points, the unlocks over time and every achievement in the badge grid, earned in hardcore. Beside
 * the chart the rarest earned, as the other platforms' examples (the home shows the pinned ones there, which need an
 * account). Nothing in it links or opens: it is an example.
 */
export default function LandingSampleRaExpanded({ gameId, total }: { gameId: number; total: number }) {
  const { T, lang } = useLanguage()
  const { data, isLoading, error, retry } = useLandingSample(gameId, loadSampleRaGame)
  const achievements = data?.achievements ?? []
  const players = data?.players ?? 1
  const earned = achievements.filter((a) => a.DateEarnedHardcore).length
  const count = achievements.length || total

  return (
    <GameExpandedLayout
      earned={earned}
      total={count}
      ringLabel={T.gameExpanded.allAchievements}
      ringExtra={
        <GameExpandedMobileStats
          points={pointsOf(achievements, (a) => !!a.DateEarnedHardcore)}
          totalPoints={pointsOf(achievements, () => true)}
          hardcorePoints={pointsOf(achievements, (a) => !!a.DateEarnedHardcore)}
          completionPct={count > 0 ? Math.round((earned / count) * 100) : 0}
          remaining={count - earned}
        />
      }
      gridTitle={T.gameExpanded.allAchievements}
      unlocks={fromRa(achievements, players, gameId)}
      isLoading={isLoading}
      side={
        <RarestEarned
          title={T.steam.rarestUnlocked}
          empty={T.steam.noneUnlocked}
          isLoading={isLoading}
          ring="ring-hardcore"
          rows={achievements
            .filter((a) => a.DateEarnedHardcore)
            .map((a) => {
              const rarity = (a.NumAwarded / players) * 100
              return {
                key: String(a.ID),
                name: a.Title,
                icon: raBadgeUrl(a.BadgeName) ?? null,
                rarity,
                subline: <span className="text-text-secondary">{formatRarity(rarity, lang)}{T.achievement.haveIt}</span>,
              }
            })}
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
        <BadgeGrid<RetroAchievement>
          items={achievements}
          keyOf={(a) => a.ID}
          badgeSize={40}
          name={(a) => a.Title}
          label={(a, name) => `${name}, ${a.DateEarnedHardcore ? T.steam.earned : T.steam.locked}`}
          earned={(a) => !!a.DateEarnedHardcore}
          ring={(a) => (a.DateEarnedHardcore ? 'ring-hardcore' : undefined)}
          icon={(a) => raBadgeUrl(a.BadgeName) ?? null}
          tip={(a) => {
            const tag = raTypeTag(a.Type, T.achievement)
            return {
              description: a.Description,
              chips: (
                <>
                  <span className="text-xs text-text-secondary">{a.Points} {T.libraryDetail.pointsShort}</span>
                  {tag && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tag.className}`}>{tag.label}</span>}
                  <BadgeEarnedChip earned={!!a.DateEarnedHardcore} label={T.achievement.hardcore} className="bg-warning/20 text-warning" />
                </>
              ),
              date: a.DateEarnedHardcore ? formatDate(a.DateEarnedHardcore, lang) : null,
            }
          }}
        />
      </LazyBadgeGrid>
    </GameExpandedLayout>
  )
}
