'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import PsnLibraryDetail from '@/components/psn/psn-library-detail/PsnLibraryDetail'
import StatusGameCard from '@/components/status-game-card/StatusGameCard'
import GameCardMark from '@/components/game-card-mark/GameCardMark'
import GameCardPlatformTag from '@/components/game-card-platform-tag/GameCardPlatformTag'
import GameCardPlaytime from '@/components/game-card-playtime/GameCardPlaytime'
import GameCardDates from '@/components/game-card-dates/GameCardDates'
import { COVER_IMAGE } from '@/components/game-card-cover/GameCardCover'
import { gameHref } from '@/utils/gameRef'
import { psnBackdrop, psnPlatformTone } from '@/utils/psnTitles'
import type { PsnGameProgress } from '@/types/psn'

/**
 * A PSN game on a category page: StatusGameCard with PSN's numbers: trophies counted, the trophies by
 * grade, play time, and a "Platinum" chip once the platinum is earned. In the Completed list the date
 * is when it was finished.
 */
export default function PsnStatusGameItem({ game, category }: { game: PsnGameProgress; /** Which list it is in: what the opened card shows depends on it. */ category?: string }) {
  const { T } = useLanguage()
  const done = game.pctWon >= 100

  return (
    <StatusGameCard
      source="psn"
      gameId={game.id}
      href={gameHref('psn', game.id)}
      title={game.title}
      backdrop={psnBackdrop(game)}
      hideImage={game.imageIcon}
      cover={<GameIcon source="psn" id={game.id} imageUrl={game.imageIcon} size={96} className={COVER_IMAGE} />}
      ring={done ? 'platinum' : undefined}
      chips={
        <>
          <GameCardPlatformTag source="psn" tone={psnPlatformTone(game.consoleName)} label={game.consoleName} />
          {game.earned.platinum > 0 && <GameCardMark tone="platinum">{T.psn.platinum}</GameCardMark>}
        </>
      }
      progress={{
        text: T.psn.trophiesProgress.replace('{earned}', String(game.numAwarded)).replace('{total}', String(game.maxPossible)),
        done,
        pct: game.pctWon,
      }}
      expand={{ show: T.psn.showTrophies, hide: T.psn.hideTrophies }}
      detail={<PsnLibraryDetail game={game} category={category} />}
    >
      <PsnTrophyCounts earned={game.earned} of={game.defined} className="mt-1" />
      {game.playtimeMinutes !== null && <GameCardPlaytime minutes={game.playtimeMinutes} />}
      <GameCardDates finishedAt={category === 'completed' ? game.completedAt : null} lastPlayed={game.lastPlayed} />
    </StatusGameCard>
  )
}
