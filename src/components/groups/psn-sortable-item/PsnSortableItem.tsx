'use client'

import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnGameItemTrophies from '@/components/psn/psn-game-item-trophies/PsnGameItemTrophies'
import GameCardMark from '@/components/game-card-mark/GameCardMark'
import GameCardPlatformTag from '@/components/game-card-platform-tag/GameCardPlatformTag'
import GameCardPlaytime from '@/components/game-card-playtime/GameCardPlaytime'
import { COVER_IMAGE } from '@/components/game-card-cover/GameCardCover'
import GroupGameCard from '@/components/groups/group-game-card/GroupGameCard'
import { gameHref } from '@/utils/gameRef'
import { psnBackdrop, psnTitleId, psnPlatformTone } from '@/utils/psnTitles'
import type { GameGroupItem } from '@/types/types'

/**
 * A PSN game in a group: GroupGameCard with PSN's numbers, read live from the shared list; the counts
 * stored when the game was added are the fallback (list still loading, or PSN unlinked).
 */
export default function PsnSortableItem({
  item,
  onRemove,
  draggable,
}: {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
}) {
  const { T } = useLanguage()
  const { fullLibrary } = usePsnGamesData()
  const game = fullLibrary.find((g) => g.id === item.game_id) ?? null

  const earned = game ? game.numAwarded : item.num_awarded
  const total = game ? game.maxPossible : item.max_possible
  const pct = game ? game.pctWon : Math.round(parseFloat(item.pct_won) * 100) || 0
  const icon = game?.imageIcon ?? item.image_icon ?? null
  const done = pct >= 100

  return (
    <GroupGameCard
      item={item}
      onRemove={onRemove}
      draggable={draggable}
      href={gameHref('psn', item.game_id)}
      title={game?.title ?? item.title}
      backdrop={game ? psnBackdrop(game) : icon}
      cover={<GameIcon source="psn" id={item.game_id} imageUrl={icon} size={96} className={COVER_IMAGE} />}
      ring={done ? 'platinum' : undefined}
      chips={
        <>
          <GameCardPlatformTag source="psn" tone={psnPlatformTone(game?.consoleName ?? '')} label={game?.consoleName ?? 'PlayStation'} />
          {game && game.earned.platinum > 0 && <GameCardMark tone="platinum">{T.psn.platinum}</GameCardMark>}
        </>
      }
      progress={{
        text: T.psn.trophiesProgress.replace('{earned}', String(earned)).replace('{total}', String(total)),
        done,
        pct: total > 0 ? pct : null,
      }}
      detail={game?.playtimeMinutes != null ? <GameCardPlaytime minutes={game.playtimeMinutes} /> : null}
      lastPlayed={game?.lastPlayed}
      expand={{ show: T.psn.showTrophies, hide: T.psn.hideTrophies }}
      panel={() => (
        <PsnGameItemTrophies gameId={item.game_id} titleId={psnTitleId(item.game_id)} gameTitle={item.title} expectedCount={total || undefined} badgeSize={48} limit={60} />
      )}
    />
  )
}
