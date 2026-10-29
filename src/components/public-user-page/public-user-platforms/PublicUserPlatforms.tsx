'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryGame } from '@/utils/library'
import { summarizeByPlatform } from '@/utils/library'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'
import { ProgressBar } from '@/components/ui/ProgressBar'
import EmptyState from '@/components/empty-state/EmptyState'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'

const LOGOS: Record<GameSource, ReactNode> = {
  ra: <RaLogo height={11} />,
  steam: <SteamLogo size={14} className="text-[#66c0f4]" aria-hidden="true" />,
  psn: <PlaystationLogo size={14} className="text-[#0070d1]" aria-hidden="true" />,
  xbox: <XboxLogo size={14} className="text-[#107c10]" aria-hidden="true" />,
}

/** Games played on each platform: how many, at 100%, under way, and how far along on average. */
export default function PublicUserPlatforms({ games, isLoading }: { games: LibraryGame[]; isLoading: boolean }) {
  const { T } = useLanguage()
  const platforms = summarizeByPlatform(games)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-text-secondary">{T.userProfile.byPlatform}</h2>
      {isLoading ? (
        <div aria-busy="true" className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 rounded-tile bg-bg-main animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      ) : platforms.length === 0 ? (
        <EmptyState icon={null} title={T.userProfile.noGames} size="compact" />
      ) : (
        <ul className="flex flex-col gap-2">
          {platforms.map((p) => (
            <li key={p.source} className="bg-bg-main rounded-tile p-3 flex flex-col gap-2.5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {LOGOS[p.source]}
                {PLATFORM_NAME[p.source]}
              </p>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col-reverse">
                  <dt className="text-[10px] text-text-secondary">{T.userProfile.games}</dt>
                  <dd className="text-lg font-bold tabular-nums">{p.games.toLocaleString()}</dd>
                </div>
                <div className="flex flex-col-reverse">
                  <dt className="text-[10px] text-text-secondary">{T.userProfile.completed}</dt>
                  <dd className="text-lg font-bold tabular-nums text-success">{p.completed.toLocaleString()}</dd>
                </div>
                <div className="flex flex-col-reverse">
                  <dt className="text-[10px] text-text-secondary">{T.userProfile.playing}</dt>
                  <dd className="text-lg font-bold tabular-nums">{p.playing.toLocaleString()}</dd>
                </div>
              </dl>
              <div className="flex items-center gap-2">
                <ProgressBar pct={p.avgPct} label={`${PLATFORM_NAME[p.source]} — ${T.userProfile.avgProgress}`} />
                <span className="text-xs tabular-nums text-text-secondary shrink-0">
                  {T.userProfile.avgProgress} {p.avgPct}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
