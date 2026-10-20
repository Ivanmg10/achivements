'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import GameIcon from '@/components/game-icon/GameIcon'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { gameHref } from '@/utils/gameRef'
import { formatPlaytime } from '@/utils/steamFeed'
import type { XboxGameProgress } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'

/**
 * The game card in the Xbox profile — the PSN one's counterpart: the last game
 * played, with its progress and gamerscore. Opens the Xbox game page.
 */
export default function MainPageProfileXboxGame({ game }: { game: XboxGameProgress }) {
  const { T, lang } = useLanguage()
  const subject = useSubject()

  return (
    <Link
      href={gameHref('xbox', game.id, subject)}
      className="bg-bg-main rounded-lg p-3 flex flex-col gap-3 w-full hover:scale-[1.005] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
    >
      <p className="text-xs text-text-secondary uppercase tracking-wider">{T.steam.lastPlayed}</p>
      <div className="flex gap-3 items-center">
        <GameIcon source="xbox" id={game.id} imageUrl={game.imageIcon} size={50} className="w-12.5 h-12.5 rounded-lg shrink-0" />
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
            <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-progress" />
            <span className={game.pctWon >= 100 ? 'text-success font-semibold' : ''}>{game.pctWon}%</span>
          </span>
          <span className="tabular-nums">{game.totalKnown ? `${game.numAwarded} / ${game.maxPossible}` : game.numAwarded}</span>
        </div>
        <ProgressBar pct={game.pctWon} label={game.title} trackClass="bg-bg-card" height="h-2" />
        <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="mt-1" />
      </div>
    </Link>
  )
}
