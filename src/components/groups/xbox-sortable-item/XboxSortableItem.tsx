'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import GameIcon from '@/components/game-icon/GameIcon'
import XboxGameItemAchievements from '@/components/xbox/xbox-game-item-achievements/XboxGameItemAchievements'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import GameCardMark from '@/components/game-card-mark/GameCardMark'
import GameCardPlatformTag from '@/components/game-card-platform-tag/GameCardPlatformTag'
import { COVER_IMAGE } from '@/components/game-card-cover/GameCardCover'
import GroupGameCard from '@/components/groups/group-game-card/GroupGameCard'
import { gameHref } from '@/utils/gameRef'
import { xboxBackdrop, xboxPlatformTone, xboxTitleId } from '@/utils/xboxTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import type { GameGroupItem } from '@/types/types'

/**
 * An Xbox game in a group: GroupGameCard with Xbox's numbers (gamerscore beside the achievements), read
 * live from the shared library; the counts stored when the game was added are the fallback (library
 * still loading, or Xbox unlinked).
 */
export default function XboxSortableItem({
  item,
  onRemove,
  draggable,
}: {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
}) {
  const { T, lang } = useLanguage()
  const { fullLibrary } = useXboxGamesData()
  const game = fullLibrary.find((g) => g.id === item.game_id) ?? null

  const earned = game ? game.numAwarded : item.num_awarded
  // A newer game may not say how many achievements it has; then only what is earned is written.
  const totalKnown = game ? game.totalKnown : item.max_possible > 0
  const total = game ? game.maxPossible : item.max_possible
  const pct = game ? game.pctWon : Math.round(parseFloat(item.pct_won) * 100) || 0
  const icon = game?.imageIcon ?? item.image_icon ?? null
  const done = pct >= 100

  return (
    <GroupGameCard
      item={item}
      onRemove={onRemove}
      draggable={draggable}
      href={gameHref('xbox', item.game_id)}
      title={game?.title ?? item.title}
      backdrop={game ? xboxBackdrop(game) : icon}
      cover={<GameIcon source="xbox" id={item.game_id} imageUrl={icon} size={96} className={COVER_IMAGE} />}
      ring={done ? 'success' : undefined}
      chips={
        <>
          <GameCardPlatformTag source="xbox" tone={xboxPlatformTone(game?.consoleName ?? '')} label={game?.consoleName || 'Xbox'} />
          {done && <GameCardMark tone="success">{T.steam.perfect}</GameCardMark>}
        </>
      }
      progress={{
        text: totalKnown
          ? T.xbox.achievementsProgress.replace('{earned}', String(earned)).replace('{total}', String(total))
          : T.xbox.achievementsEarned.replace('{earned}', String(earned)),
        done,
        pct: totalKnown || pct > 0 ? pct : null,
      }}
      detail={game ? <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="mt-1" /> : null}
      lastPlayed={game?.lastPlayed}
      fact={game?.playtimeMinutes != null && `${T.steam.playtime} ${formatPlaytime(game.playtimeMinutes, T.steam, lang)}`}
      expand={{ show: T.xbox.showAchievements, hide: T.xbox.hideAchievements }}
      panel={() => (
        <XboxGameItemAchievements gameId={item.game_id} titleId={xboxTitleId(item.game_id)} gameTitle={item.title} expectedCount={total || undefined} badgeSize={48} limit={60} />
      )}
    />
  )
}
