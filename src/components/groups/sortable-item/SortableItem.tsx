'use client'

import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroupItem } from '@/types/types'
import { CONSOLES } from '@/constants'
import { COVER_IMAGE } from '@/components/game-card-cover/GameCardCover'
import RaConsoleTag from '@/components/ra-console-tag/RaConsoleTag'
import GameCardLine from '@/components/game-card-line/GameCardLine'
import GroupGameCard from '@/components/groups/group-game-card/GroupGameCard'
import SortableItemAchievements from './sortable-item-achievements/SortableItemAchievements'
import { gameHref } from '@/utils/gameRef'
import { raImageUrl } from '@/utils/raAssets'

const percent = (n: number, of: number) => Math.min(Math.round((n / of) * 100), 100)

/**
 * An RA game in a group: GroupGameCard with RA's numbers: the progress in both modes (hardcore over
 * softcore), points, and the achievements read when it first opens. The counts the page knows win over
 * the ones stored when the game was added.
 */
export default function SortableItem({
  item,
  onRemove,
  draggable,
  achStats,
  ptsStats,
  lastPlayed,
}: {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
  achStats?: { scEarned: number; hcEarned: number; total: number }
  ptsStats?: { earned: number; total: number }
  lastPlayed?: string
}) {
  const { T } = useLanguage()
  const cover = raImageUrl(item.image_icon) ?? null

  const total = achStats?.total || item.max_possible
  const scEarned = achStats?.scEarned ?? item.num_awarded
  const hcEarned = achStats?.hcEarned ?? 0
  const scPct = total > 0 ? percent(scEarned, total) : Math.min(Math.round(parseFloat(item.pct_won) * 100), 100)
  const hcPct = total > 0 ? percent(hcEarned, total) : 0
  const ptsEarned = ptsStats?.earned ?? item.points_won
  const ptsTotal = ptsStats?.total || item.max_points
  const done = Math.max(scPct, hcPct) >= 100

  return (
    <GroupGameCard
      item={item}
      onRemove={onRemove}
      draggable={draggable}
      href={gameHref('ra', item.game_id)}
      title={item.title}
      backdrop={cover}
      cover={
        cover ? (
          <Image src={cover} alt="" width={96} height={96} className={`${COVER_IMAGE} object-cover`} unoptimized />
        ) : (
          <div className={`${COVER_IMAGE} bg-bg-main`} />
        )
      }
      chips={
        item.console_name ? <RaConsoleTag console={CONSOLES.find((c) => c.name === item.console_name)} name={item.console_name} /> : null
      }
      progress={{
        text: `${total > 0 ? `${Math.max(scEarned, hcEarned)} / ${total}` : total} ${T.statusGameItem.achievements}`,
        done,
        pct: total > 0 ? hcPct : null,
        softPct: scPct,
      }}
      detail={ptsTotal > 0 ? <GameCardLine>{`${ptsEarned} / ${ptsTotal} ${T.statusGameItem.pointsEarned}`}</GameCardLine> : null}
      lastPlayed={lastPlayed}
      expand={{ show: T.steam.showAchievements, hide: T.steam.hideAchievements }}
      panel={(open) => <SortableItemAchievements gameId={item.game_id} title={item.title} total={total} open={open} />}
    />
  )
}
