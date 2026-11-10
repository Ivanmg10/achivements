'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamGameItemAchievements from '@/components/steam/steam-game-item/steam-game-item-achievements/SteamGameItemAchievements'
import GameCardMark from '@/components/game-card-mark/GameCardMark'
import GameCardPlatformTag from '@/components/game-card-platform-tag/GameCardPlatformTag'
import GameCardPlaytime from '@/components/game-card-playtime/GameCardPlaytime'
import { COVER_IMAGE } from '@/components/game-card-cover/GameCardCover'
import GroupGameCard from '@/components/groups/group-game-card/GroupGameCard'
import { steamAssetUrl } from '@/lib/steamAssets'
import { gameHref } from '@/utils/gameRef'
import type { GameGroupItem } from '@/types/types'

/**
 * A Steam game in a group: GroupGameCard with Steam's numbers, read live from the shared library; the
 * counts stored when the game was added are the fallback (library still loading, or the game has left it).
 */
export default function SteamSortableItem({
  item,
  onRemove,
  draggable,
}: {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
}) {
  const { T } = useLanguage()
  const { library, recent } = useSteamGamesData()
  const game = library.find((g) => g.id === item.game_id) ?? recent.find((g) => g.id === item.game_id) ?? null

  const live = game?.achievementsLoaded ?? false
  const earned = live ? game!.numAwarded : item.num_awarded
  const total = live ? game!.maxPossible : item.max_possible
  const hasCounts = total > 0
  const hasStats = game?.hasStats ?? true
  const done = hasCounts && earned >= total

  let text: string
  if (hasCounts) text = `${earned} / ${total} ${T.steam.achievements}`
  else if (!hasStats) text = T.steam.noAchievements
  else text = T.steam.progressUnknown

  return (
    <GroupGameCard
      item={item}
      onRemove={onRemove}
      draggable={draggable}
      href={gameHref('steam', item.game_id)}
      title={game?.title ?? item.title}
      backdrop={steamAssetUrl(item.game_id, 'header')}
      cover={<SteamGameImage appId={item.game_id} asset="icon" iconUrl={game?.imageIcon ?? item.image_icon ?? ''} size={96} className={COVER_IMAGE} />}
      ring={done ? 'steam-perfect' : undefined}
      chips={
        <>
          <GameCardPlatformTag source="steam" tone="steam" label="Steam" />
          {done && <GameCardMark tone="steam-perfect">{T.steam.perfect}</GameCardMark>}
        </>
      }
      progress={{ text, done, pct: hasCounts ? Math.min((earned / total) * 100, 100) : null }}
      detail={game ? <GameCardPlaytime minutes={game.playtimeForever} /> : null}
      lastPlayed={game?.lastPlayed}
      expand={{ show: T.steam.showAchievements, hide: T.steam.hideAchievements }}
      panel={() =>
        hasStats ? (
          <SteamGameItemAchievements appId={item.game_id} gameTitle={item.title} expectedCount={hasCounts ? total : undefined} badgeSize={48} limit={60} />
        ) : (
          <p className="text-center text-text-secondary text-sm py-2">{T.steam.noAchievements}</p>
        )
      }
    />
  )
}
