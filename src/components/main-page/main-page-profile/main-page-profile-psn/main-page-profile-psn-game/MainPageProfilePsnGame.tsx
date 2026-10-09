'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import { SteamProgressBar } from '@/components/ui/SteamProgressBar'
import { gameHref } from '@/utils/gameRef'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnGameProgress } from '@/types/psn'

/**
 * The game card in the PSN profile — the Steam one's counterpart: the last
 * game played (Sony does not say what is running right now), with its play
 * time, progress and trophies by grade. Opens the PSN game page.
 */
export default function MainPageProfilePsnGame({ game }: { game: PsnGameProgress }) {
  const { T, lang } = useLanguage()

  return (
    <Link
      href={gameHref('psn', game.id)}
      className="bg-bg-main rounded-lg p-3 flex flex-col gap-3 w-full hover:scale-[1.005] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1]"
    >
      <p className="text-xs text-text-secondary uppercase tracking-wider">{T.steam.lastPlayed}</p>
      <div className="flex gap-3 items-center">
        <GameIcon source="psn" id={game.id} imageUrl={game.imageIcon} size={50} className="w-12.5 h-12.5 rounded-lg shrink-0" />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{game.title}</span>
          <span className="text-xs text-text-secondary">
            {game.consoleName}
            {game.playtimeMinutes !== null &&
              ` · ${T.steam.playtime}: ${formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}`}
            {game.lastPlayed && ` · ${new Date(game.lastPlayed).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}`}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-[#0070d1]" />
            {game.pctWon}%
          </span>
          <span className="tabular-nums">
            {game.numAwarded} / {game.maxPossible}
          </span>
        </div>
        <SteamProgressBar pct={game.pctWon} label={game.title} trackClass="bg-bg-card" height="h-2" />
        <PsnTrophyCounts earned={game.earned} of={game.defined} className="mt-1" />
      </div>
    </Link>
  )
}
