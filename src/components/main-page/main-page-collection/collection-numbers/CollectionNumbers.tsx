'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { RetroAchievementsGameCompleted, UserAwards } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { classifySteamGame, hasUnloadedProgress, summarizeSteamLibrary } from '@/utils/steamFeed'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import CompletionDistribution from '@/components/completion-distribution/CompletionDistribution'
import MasteryMix from '@/components/main-page/main-page-charts/mastery-mix/MasteryMix'
import ClosestToComplete, { CLOSEST_SHOWN, ClosestGame } from '@/components/main-page/main-page-charts/closest-to-complete/ClosestToComplete'

const BLOCK = 'flex flex-col gap-3 pt-4 border-t border-ink/[0.06] first:pt-0 first:border-t-0'

/**
 * The numbers behind the collection, both platforms at once (they no longer
 * swap with the platform selector): RA's masteries and award mix, Steam's
 * perfect games and how far along the rest are, and the games nearest 100%
 * on either.
 */
export default function CollectionNumbers({
  awards,
  inProgress = [],
  steamGames = [],
}: {
  awards: UserAwards | null
  inProgress?: RetroAchievementsGameCompleted[]
  steamGames?: SteamGameProgress[]
}) {
  const { T } = useLanguage()

  const steam = useMemo(() => summarizeSteamLibrary(steamGames), [steamGames])
  const fractions = useMemo(
    () => steamGames.filter((g) => g.achievementsLoaded && g.maxPossible > 0).map((g) => g.numAwarded / g.maxPossible),
    [steamGames],
  )
  // The started games nearest 100%, whichever platform they are on.
  const closest = useMemo<ClosestGame[]>(() => {
    const ra = inProgress.map((g) => ({
      key: `ra:${g.GameID}`,
      href: `/gameInfo/${g.GameID}`,
      title: g.Title,
      imageUrl: g.ImageIcon ? `https://retroachievements.org${g.ImageIcon}` : undefined,
      done: g.NumAwarded,
      total: g.MaxPossible,
      percent: parseFloat(g.PctWon) * 100,
    }))
    const st = steamGames
      .filter((g) => classifySteamGame(g) === 'playing')
      .map((g) => ({
        key: `steam:${g.id}`,
        href: `/steamGame/${g.id}`,
        title: g.title,
        imageUrl: g.imageIcon || undefined,
        done: g.numAwarded,
        total: g.maxPossible,
        percent: g.pctWon,
      }))
    return [...ra, ...st].sort((a, b) => b.percent - a.percent).slice(0, CLOSEST_SHOWN)
  }, [inProgress, steamGames])

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-text-main">{T.cards.yourNumbers}</h3>

      <div className="flex flex-col gap-4">
        {awards && (
          <section className={BLOCK} aria-label="RetroAchievements">
            <span className="flex items-center gap-2 text-xs text-text-secondary">
              <RaLogo height={11} /> RetroAchievements
            </span>
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-warning tabular-nums leading-none">{awards.MasteryAwardsCount ?? 0}</span>
              <span className="text-xs text-text-secondary">
                {T.cards.mastered}
                {awards.TotalAwardsCount !== null && ` · ${awards.TotalAwardsCount.toLocaleString()} ${T.userStats.awards.toLowerCase()}`}
              </span>
            </p>
            <MasteryMix awards={awards} />
          </section>
        )}

        {steamGames.length > 0 && (
          <section className={BLOCK} aria-label="Steam">
            <span className="flex items-center gap-2 text-xs text-text-secondary">
              <SteamLogo size={12} className="text-[#66c0f4]" aria-hidden="true" /> Steam
            </span>
            <p className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#66c0f4] tabular-nums leading-none">{steam.perfect}</span>
              <span className="text-xs text-text-secondary">
                {T.steam.statPerfect} · {fractions.length} {T.steam.statGames.toLowerCase()}
              </span>
            </p>
            <CompletionDistribution fractions={fractions} tone="steam" note={hasUnloadedProgress(steamGames) ? T.steam.partialProgressNote : undefined} />
          </section>
        )}

        {closest.length > 0 && (
          <section className={BLOCK}>
            <ClosestToComplete games={closest} statClassName="text-accent" />
          </section>
        )}
      </div>
    </div>
  )
}
