'use client'

import MainPageProfileNowPlaying from '../../main-page-profile-now-playing/MainPageProfileNowPlaying'
import { useLanguage } from '@/context/LanguageContext'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { gameHref } from '@/utils/gameRef'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnGameProgress } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'

/**
 * The game card in the PSN profile — the Steam one's counterpart: the last
 * game played (Sony does not say what is running right now), with its play
 * time, progress and trophies by grade. Opens the PSN game page.
 */
export default function MainPageProfilePsnGame({ game }: { game: PsnGameProgress }) {
  const { T, lang } = useLanguage()
  const subject = useSubject()

  const when = game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString(lang, { day: 'numeric', month: 'short' }) : null
  const playtime = game.playtimeMinutes !== null ? formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang) : null

  return (
    <MainPageProfileNowPlaying
      href={gameHref('psn', game.id, subject)}
      tintSrc={game.imageIcon}
      kicker={T.steam.lastPlayed}
      icon={<GameIcon source="psn" id={game.id} imageUrl={game.imageIcon} size={52} className="w-full h-full" />}
      title={game.title}
      sub={[game.consoleName, playtime, when].filter(Boolean).join(' · ')}
      share={`${game.pctWon.toLocaleString(lang)} %`}
      done={game.pctWon >= 100}
      bar={
        <span className="flex flex-col gap-2">
          <ProgressBar pct={game.pctWon} label={game.title} />
          <PsnTrophyCounts earned={game.earned} of={game.defined} className="text-[0.8125rem]" />
        </span>
      }
    />
  )
}
