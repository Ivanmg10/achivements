'use client'

import { useLanguage } from '@/context/LanguageContext'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatPlaytime } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import MainPageProfileNowPlaying from '../../main-page-profile-now-playing/MainPageProfileNowPlaying'
import { steamAssetUrl } from '@/lib/steamAssets'

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
  const subject = useSubject()
  const hasCounts = game.achievementsLoaded && game.maxPossible > 0
  const playtime = formatPlaytime(game.playtimeForever, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)

  return (
    <MainPageProfileNowPlaying
      href={gameHref('steam', game.id, subject)}
      tintSrc={steamAssetUrl(game.id, 'header')}
      kicker={playingNow ? T.profileRa.playingNow : T.steam.lastPlayed}
      icon={<SteamGameImage appId={game.id} asset="icon" iconUrl={game.imageIcon} size={52} className="w-full h-full" />}
      title={game.title}
      sub={`Steam · ${playtime}`}
      share={hasCounts ? `${Math.round(game.pctWon).toLocaleString(lang)} %` : null}
      done={hasCounts && game.pctWon >= 100}
      bar={hasCounts ? <ProgressBar pct={game.pctWon} label={game.title} /> : null}
    />
  )
}
