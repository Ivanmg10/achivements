'use client'

import Image from 'next/image'
import type { CategoryGame } from '@/hooks/useGamesByCategory'
import type { GameExtraData } from './StatusGameList'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES } from '@/constants'
import StatusGameCard from '@/components/status-game-card/StatusGameCard'
import RaConsoleTag from '@/components/ra-console-tag/RaConsoleTag'
import { COVER_IMAGE } from '@/components/game-card-cover/GameCardCover'
import StatusGameItemAwards from './status-game-item-awards/StatusGameItemAwards'
import StatusGameItemDetail from './status-game-item-detail/StatusGameItemDetail'
import StatusGameItemLines from './status-game-item-lines/StatusGameItemLines'
import { gameHref } from '@/utils/gameRef'
import { raImageUrl } from '@/utils/raAssets'

function getAchievementMeta(g: CategoryGame): { earned: number | null; total: number; pct: number | null } {
  if ('AchievementsPublished' in g) {
    return { earned: null, total: g.AchievementsPublished, pct: null }
  }
  const pct = parseFloat(g.PctWon) * 100
  return { earned: g.NumAwarded, total: g.MaxPossible, pct }
}

/**
 * An RA game on a category page: StatusGameCard with RA's numbers: achievements (a want-to-play game
 * only has its total), the bar in the mode it was played (hardcore over softcore, ringed when hardcore),
 * the console chip and the awards, points and last played.
 */
export default function StatusGameItem({
  game,
  extra,
  category,
}: {
  game: CategoryGame
  extra?: GameExtraData
  category?: string
}) {
  const { T } = useLanguage()
  const gameId = Number(game.ID ?? game.GameID)
  const { earned, total, pct } = getAchievementMeta(game)
  const cover = raImageUrl(game.ImageIcon) ?? null
  const isHardcore = 'HardcoreMode' in game && Number(game.HardcoreMode) === 1

  return (
    <StatusGameCard
      source="ra"
      gameId={gameId}
      href={gameHref('ra', gameId)}
      title={game.Title}
      backdrop={cover}
      hideImage={cover}
      cover={cover && <Image src={cover} alt="" width={96} height={96} className={`${COVER_IMAGE} object-cover`} />}
      ring={isHardcore ? 'hardcore' : undefined}
      chips={
        <>
          <RaConsoleTag console={CONSOLES.find((c) => c.id === Number(game.ConsoleID))} name={game.ConsoleName} />
          {extra && <StatusGameItemAwards awards={extra.awards} />}
        </>
      }
      progress={{
        text: `${earned !== null ? `${earned} / ${total}` : total} ${T.statusGameItem.achievements}`,
        done: earned !== null && earned === total && total > 0,
        pct: pct === null ? null : isHardcore ? pct : 0,
        softPct: pct !== null && !isHardcore ? pct : 0,
      }}
      expand={{ show: T.cards.showAchievements, hide: T.cards.hideAchievements }}
      detail={<StatusGameItemDetail game={game} gameId={game.ID ?? game.GameID!} category={category} />}
    >
      <StatusGameItemLines game={game} extra={extra} category={category} />
    </StatusGameCard>
  )
}
