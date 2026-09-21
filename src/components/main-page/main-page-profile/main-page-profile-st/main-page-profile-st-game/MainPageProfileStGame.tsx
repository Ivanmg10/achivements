'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import { SteamProgressBar } from '@/components/ui/SteamProgressBar'
import { formatPlaytime } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'

/**
 * The game card in the Steam profile — MainPageProfileRaGame's counterpart:
 * the game being played right now, or else the last one played, with its
 * completion bar. Opens the Steam game page.
 */
export default function MainPageProfileStGame({
  game,
  playingNow,
}: {
  game: SteamGameProgress
  /** True when Steam reports this game as running right now. */
  playingNow: boolean
}) {
  const { T, lang } = useLanguage()
  const hasCounts = game.achievementsLoaded && game.maxPossible > 0
  const playtime = formatPlaytime(game.playtimeForever, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)

  return (
    <Link
      href={`/steamGame/${game.id}`}
      className="bg-bg-main rounded-lg p-3 flex flex-col gap-3 w-full hover:scale-[1.005] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
    >
      <p className="text-xs text-gray-400 uppercase tracking-wider">
        {playingNow ? T.profileRa.playingNow : T.steam.lastPlayed}
      </p>
      <div className="flex gap-3 items-center">
        <SteamGameImage appId={game.id} iconUrl={game.imageIcon} size={50} className="w-12.5 h-12.5 rounded-lg shrink-0" />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{game.title}</span>
          <span className="text-xs text-gray-400">
            Steam · {T.steam.playtime}: {playtime}
          </span>
        </div>
      </div>
      {hasCounts && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-[#66c0f4]" />
              {Math.round(game.pctWon)}%
            </span>
            <span className="tabular-nums">
              {game.numAwarded} / {game.maxPossible}
            </span>
          </div>
          <SteamProgressBar pct={game.pctWon} label={game.title} trackClass="bg-bg-card" height="h-2" />
        </div>
      )}
    </Link>
  )
}
