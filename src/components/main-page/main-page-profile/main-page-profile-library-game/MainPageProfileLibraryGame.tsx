'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import GameIcon from '@/components/game-icon/GameIcon'
import Facts from '@/components/ui/Facts'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate } from '@/utils/dates'
import { gameHref } from '@/utils/gameRef'
import { formatPlaytime } from '@/utils/steamFeed'
import MainPageProfileNowPlaying from '../main-page-profile-now-playing/MainPageProfileNowPlaying'

/**
 * The last game played in the PSN and Xbox profiles (neither says what is running right now): its
 * console, play time and day, its share and bar, and what the platform counts under the bar (trophies
 * by grade, gamerscore). Opens the game's page.
 */
export default function MainPageProfileLibraryGame({
  source,
  game,
  counts,
}: {
  source: 'psn' | 'xbox'
  game: { id: number; title: string; imageIcon: string | null; consoleName: string; lastPlayed: string | null; playtimeMinutes: number | null; pctWon: number }
  counts: ReactNode
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()

  const when = game.lastPlayed ? formatDate(game.lastPlayed, lang, { day: 'numeric', month: 'short' }) : null
  const playtime = game.playtimeMinutes !== null ? formatPlaytime(game.playtimeMinutes, T.steam, lang) : null

  return (
    <MainPageProfileNowPlaying
      href={gameHref(source, game.id, subject)}
      tintSrc={game.imageIcon}
      kicker={T.steam.lastPlayed}
      icon={<GameIcon source={source} id={game.id} imageUrl={game.imageIcon} size={52} className="w-full h-full" />}
      title={game.title}
      sub={<Facts items={[game.consoleName, playtime, when]} />}
      share={`${game.pctWon.toLocaleString(lang)} %`}
      done={game.pctWon >= 100}
      bar={
        <span className="flex flex-col gap-2">
          <ProgressBar pct={game.pctWon} label={game.title} />
          {counts}
        </span>
      }
    />
  )
}
