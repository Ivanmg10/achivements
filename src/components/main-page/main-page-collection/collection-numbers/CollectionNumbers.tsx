'use client'

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { UserAwards } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import type { XboxGameProgress } from '@/types/xbox'
import { formatPlaytime, hasUnloadedProgress, summarizeSteamLibrary } from '@/utils/steamFeed'
import { classifyPsnGame, totalPlaytime } from '@/utils/psnTitles'
import { classifyXboxGame, totalXboxPlaytime, xboxHasAchievements } from '@/utils/xboxTitles'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import CompletionDistribution from '@/components/completion-distribution/CompletionDistribution'
import MasteryMix from '@/components/main-page/main-page-charts/mastery-mix/MasteryMix'

/** One platform's tile in the strip: its name, its headline number and what it counts, then its bar. */
function PlatformTile({ label, logo, value, valueClass, caption, children }: { label: string; logo: ReactNode; value: number; valueClass: string; caption: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="flex flex-col gap-2 rounded-box bg-bg-main p-3 min-w-0">
      <span className="flex items-center gap-2 text-xs text-text-secondary">
        {logo} {label}
      </span>
      <p className="flex items-baseline gap-2 min-w-0">
        <span className={`text-2xl font-bold tabular-nums leading-none ${valueClass}`}>{value}</span>
        <span className="text-xs text-text-secondary truncate">{caption}</span>
      </p>
      {children}
    </section>
  )
}

/**
 * The numbers behind the collection as one strip across the page: the total
 * play time on top, then a tile per platform side by side (RA's masteries and
 * award mix, the perfect games and how far along the rest are elsewhere), each
 * bar with its counts. Stacked in a column, they made the section far taller
 * than the collection beside them.
 */
export default function CollectionNumbers({
  awards,
  steamGames = [],
  psnGames = [],
  xboxGames = [],
}: {
  awards: UserAwards | null
  steamGames?: SteamGameProgress[]
  psnGames?: PsnGameProgress[]
  xboxGames?: XboxGameProgress[]
}) {
  const { T, lang } = useLanguage()

  const steam = useMemo(() => summarizeSteamLibrary(steamGames), [steamGames])
  // RA does not report play time, so this is Steam's, PlayStation's and Xbox's.
  const playtimeMinutes = useMemo(
    () => steam.totalMinutes + totalPlaytime(psnGames) + totalXboxPlaytime(xboxGames),
    [steam.totalMinutes, psnGames, xboxGames],
  )
  const fractions = useMemo(
    () => steamGames.filter((g) => g.achievementsLoaded && g.maxPossible > 0).map((g) => g.numAwarded / g.maxPossible),
    [steamGames],
  )
  const psnPerfect = useMemo(() => psnGames.filter((g) => classifyPsnGame(g) === 'completed').length, [psnGames])
  const psnFractions = useMemo(() => psnGames.map((g) => g.pctWon / 100), [psnGames])
  // A game with no achievements is just owned: it has no place in a completion count.
  const xboxPlayable = useMemo(() => xboxGames.filter(xboxHasAchievements), [xboxGames])
  const xboxPerfect = useMemo(() => xboxPlayable.filter((g) => classifyXboxGame(g) === 'completed').length, [xboxPlayable])
  const xboxFractions = useMemo(() => xboxPlayable.map((g) => g.pctWon / 100), [xboxPlayable])
  const perfectOf = (n: number) => `${T.steam.statPerfect} · ${n} ${T.steam.statGames.toLowerCase()}`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-semibold text-text-main">{T.cards.yourNumbers}</h3>
        {playtimeMinutes > 0 && (
          <section aria-label={T.steam.totalPlaytime}>
            <p className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text-main tabular-nums leading-none whitespace-nowrap">
                {formatPlaytime(playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
              </span>
              <span className="text-xs text-text-secondary">
                {T.steam.totalPlaytime} · {T.cards.playtimeSources}
              </span>
            </p>
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3">
        {awards && (
          <PlatformTile
            label="RetroAchievements"
            logo={<RaLogo height={11} />}
            value={awards.MasteryAwardsCount ?? 0}
            valueClass="text-warning"
            caption={`${T.cards.mastered}${awards.TotalAwardsCount !== null ? ` · ${awards.TotalAwardsCount.toLocaleString()} ${T.userStats.awards.toLowerCase()}` : ''}`}
          >
            <MasteryMix awards={awards} />
          </PlatformTile>
        )}
        {steamGames.length > 0 && (
          <PlatformTile label="Steam" logo={<SteamLogo size={12} className="text-[#66c0f4]" aria-hidden="true" />} value={steam.perfect} valueClass="text-[#66c0f4]" caption={perfectOf(fractions.length)}>
            <CompletionDistribution fractions={fractions} tone="steam" showTitle={false} note={hasUnloadedProgress(steamGames) ? T.steam.partialProgressNote : undefined} />
          </PlatformTile>
        )}
        {psnGames.length > 0 && (
          <PlatformTile label="PlayStation" logo={<PlaystationLogo size={12} className="text-[#0070d1]" aria-hidden="true" />} value={psnPerfect} valueClass="text-[#0070d1]" caption={perfectOf(psnGames.length)}>
            <CompletionDistribution fractions={psnFractions} tone="psn" showTitle={false} />
          </PlatformTile>
        )}
        {xboxPlayable.length > 0 && (
          <PlatformTile label="Xbox" logo={<XboxLogo size={12} className="text-success" aria-hidden="true" />} value={xboxPerfect} valueClass="text-success" caption={perfectOf(xboxPlayable.length)}>
            <CompletionDistribution fractions={xboxFractions} tone="xbox" showTitle={false} />
          </PlatformTile>
        )}
      </div>
    </div>
  )
}
