'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameIcon from '@/components/game-icon/GameIcon'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import XboxLibraryDetail from '@/components/xbox/xbox-library-detail/XboxLibraryDetail'
import StatusGameCard from '@/components/status-game-card/StatusGameCard'
import GameCardMark from '@/components/game-card-mark/GameCardMark'
import GameCardPlatformTag from '@/components/game-card-platform-tag/GameCardPlatformTag'
import GameCardPlaytime from '@/components/game-card-playtime/GameCardPlaytime'
import GameCardDates from '@/components/game-card-dates/GameCardDates'
import { COVER_IMAGE } from '@/components/game-card-cover/GameCardCover'
import { gameHref } from '@/utils/gameRef'
import { xboxBackdrop, xboxPlatformTone } from '@/utils/xboxTitles'
import type { XboxGameProgress } from '@/types/xbox'

/**
 * An Xbox game on a category page: StatusGameCard with Xbox's numbers: achievements (only what is
 * earned when Xbox does not say the total), gamerscore, play time, and a chip at 100 %. In the Completed
 * list the date is when it was finished.
 */
export default function XboxStatusGameItem({ game, category }: { game: XboxGameProgress; /** Which list it is in: what the opened card shows depends on it. */ category?: string }) {
  const { T } = useLanguage()
  const done = game.pctWon >= 100

  return (
    <StatusGameCard
      source="xbox"
      gameId={game.id}
      href={gameHref('xbox', game.id)}
      title={game.title}
      backdrop={xboxBackdrop(game)}
      hideImage={game.imageIcon}
      cover={<GameIcon source="xbox" id={game.id} imageUrl={game.imageIcon} size={96} className={COVER_IMAGE} />}
      ring={done ? 'success' : undefined}
      chips={
        <>
          <GameCardPlatformTag source="xbox" tone={xboxPlatformTone(game.consoleName)} label={game.consoleName} />
          {done && <GameCardMark tone="success">{T.steam.perfect}</GameCardMark>}
        </>
      }
      progress={{
        text: game.totalKnown
          ? T.xbox.achievementsProgress.replace('{earned}', String(game.numAwarded)).replace('{total}', String(game.maxPossible))
          : T.xbox.achievementsEarned.replace('{earned}', String(game.numAwarded)),
        done,
        pct: game.pctWon,
      }}
      expand={{ show: T.xbox.showAchievements, hide: T.xbox.hideAchievements }}
      detail={<XboxLibraryDetail game={game} category={category} />}
    >
      <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="mt-1" />
      {game.playtimeMinutes !== null && <GameCardPlaytime minutes={game.playtimeMinutes} />}
      <GameCardDates finishedAt={category === 'completed' ? game.completedAt : null} lastPlayed={game.lastPlayed} />
    </StatusGameCard>
  )
}
