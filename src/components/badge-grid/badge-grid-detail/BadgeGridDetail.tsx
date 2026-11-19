'use client'

import type { GameSource } from '@/types/game'
import type { CompareAchievement } from '@/utils/gameCompare'
import type { AchievementView, DetailOptions, PinControl } from '@/types/achievementTable'
import type { BadgeShown } from '@/types/badgeGrid'
import AchievementTableDetail from '@/components/achievement-table/achievement-table-detail/AchievementTableDetail'

/**
 * A Steam, PSN or Xbox badge's window: the one its game page's table opens (`AchievementTableDetail`), with the
 * same tags, guides, showcase and pin, so pressing a badge and pressing a row show the same thing (#164).
 */
export default function BadgeGridDetail<T>({
  item,
  shown,
  source,
  gameId,
  gameTitle,
  toRow,
  pins,
  options,
  onClose,
}: {
  item: T
  shown: BadgeShown
  source: Exclude<GameSource, 'ra'>
  gameId: number
  gameTitle: string
  toRow: (t: T) => CompareAchievement
  pins: Pick<PinControl<T>, 'canPin' | 'isPinned' | 'toggle'>
  options?: DetailOptions<T>
  onClose: () => void
}) {
  const view: AchievementView<T> = {
    entry: { item, row: toRow(item), order: 0 },
    title: shown.title,
    text: shown.text,
    iconUrl: shown.iconUrl,
    concealed: shown.concealed,
    highlighted: false,
    pinned: pins.canPin ? pins.isPinned(item) : undefined,
    onTogglePin: () => pins.toggle(item),
    onOpen: () => {},
  }
  return <AchievementTableDetail view={view} onClose={onClose} source={source} gameId={gameId} gameTitle={gameTitle} detail={options} />
}
