'use client'

import MainPageProfileNowPlaying from '../../main-page-profile-now-playing/MainPageProfileNowPlaying'
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

  const when = game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString(lang, { day: 'numeric', month: 'short' }) : null
  const playtime = game.playtimeMinutes !== null ? formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang) : null

  return (
    <MainPageProfileNowPlaying
      href={gameHref('xbox', game.id, subject)}
      tintSrc={game.imageIcon}
      kicker={T.steam.lastPlayed}
      icon={<GameIcon source="xbox" id={game.id} imageUrl={game.imageIcon} size={52} className="w-full h-full" />}
      title={game.title}
      sub={[game.consoleName, playtime, when].filter(Boolean).join(' · ')}
      share={`${game.pctWon.toLocaleString(lang)} %`}
      done={game.pctWon >= 100}
      bar={
        <span className="flex flex-col gap-2">
          <ProgressBar pct={game.pctWon} label={game.title} />
          <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="text-[0.8125rem]" />
        </span>
      }
    />
  )
}
