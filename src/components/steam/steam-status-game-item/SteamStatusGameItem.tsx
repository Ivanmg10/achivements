'use client'

import { useLanguage } from '@/context/LanguageContext'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamLibraryDetail from '@/components/steam/steam-library-detail/SteamLibraryDetail'
import StatusGameCard from '@/components/status-game-card/StatusGameCard'
import GameCardMark from '@/components/game-card-mark/GameCardMark'
import GameCardPlatformTag from '@/components/game-card-platform-tag/GameCardPlatformTag'
import GameCardPlaytime from '@/components/game-card-playtime/GameCardPlaytime'
import GameCardDates from '@/components/game-card-dates/GameCardDates'
import { COVER_IMAGE } from '@/components/game-card-cover/GameCardCover'
import { steamAssetUrl } from '@/lib/steamAssets'
import { gameHref } from '@/utils/gameRef'
import type { SteamGameProgress } from '@/types/steam'

/**
 * A Steam game on a category page: StatusGameCard with Steam's numbers: achievements counted once the
 * library has read them, play time, and a "Perfect" chip for a game at 100 %. A game with no stats says
 * so instead of counting, and in the Completed list the date it was finished is its last unlock.
 */
export default function SteamStatusGameItem({
  game,
  category,
  inSection = false,
}: {
  game: SteamGameProgress
  /** Which list it is in: what the opened card shows depends on it. */
  category?: string
  /** Inside the Steam section, whose head already says Steam: no "Steam" chip (Steam has no console to name). */
  inSection?: boolean
}) {
  const { T } = useLanguage()
  const hasCounts = game.achievementsLoaded && game.maxPossible > 0
  const done = hasCounts && game.numAwarded >= game.maxPossible

  let text: string
  if (hasCounts) text = `${game.numAwarded} / ${game.maxPossible} ${T.steam.achievements}`
  else if (!game.hasStats) text = T.steam.noAchievements
  else text = T.steam.progressUnknown

  return (
    <StatusGameCard
      source="steam"
      gameId={game.id}
      href={gameHref('steam', game.id)}
      title={game.title}
      backdrop={steamAssetUrl(game.id, 'header')}
      hideImage={steamAssetUrl(game.id, 'header')}
      cover={<SteamGameImage appId={game.id} asset="icon" iconUrl={game.imageIcon} size={96} className={COVER_IMAGE} />}
      ring={done ? 'steam-perfect' : undefined}
      chips={
        <>
          {!inSection && <GameCardPlatformTag source="steam" tone="steam" label="Steam" />}
          {done && <GameCardMark tone="steam-perfect">{T.steam.perfect}</GameCardMark>}
        </>
      }
      progress={{ text, done, pct: hasCounts ? game.pctWon : null }}
      expand={{ show: T.cards.showAchievements, hide: T.cards.hideAchievements }}
      detail={
        game.hasStats ? (
          <SteamLibraryDetail game={game} category={category} />
        ) : (
          <p className="text-center text-text-secondary text-sm py-2">{T.steam.noAchievements}</p>
        )
      }
    >
      <GameCardPlaytime minutes={game.playtimeForever} />
      <GameCardDates finishedAt={category === 'completed' ? game.lastUnlock : null} lastPlayed={game.lastPlayed} never={T.steam.neverPlayed} />
    </StatusGameCard>
  )
}
