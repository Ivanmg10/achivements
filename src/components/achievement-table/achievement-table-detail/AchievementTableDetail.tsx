'use client'

import dynamic from 'next/dynamic'
import type { GameSource } from '@/types/game'
import type { AchievementView, DetailOptions } from '@/types/achievementTable'
import { guideLinks } from '@/utils/guideLinks'

// Downloaded the first time it opens, not with the page.
const AchievementDetailModal = dynamic(() => import('@/components/achievement-detail-modal/AchievementDetailModal'), { loading: () => null })

/**
 * The detail window of a row: the platform's own when it draws one (RA's), or
 * the shared one with guide links (none for a secret one still hidden: a search
 * would give it away) and, once earned with a date, the way into the showcase.
 */
export default function AchievementTableDetail<T>({
  view,
  onClose,
  source,
  gameId,
  gameTitle,
  detail,
}: {
  view: AchievementView<T>
  onClose: () => void
  source: GameSource
  gameId: number
  gameTitle: string
  detail?: DetailOptions<T>
}) {
  const { item, row } = view.entry
  if (detail?.render) return detail.render(item, { pinned: view.pinned, onTogglePin: view.onTogglePin, onClose })
  if (source === 'ra') return null
  return (
    <AchievementDetailModal
      title={view.title}
      description={view.text}
      iconUrl={view.iconUrl}
      earned={row.earned}
      earnedAt={row.earnedAt}
      rarity={row.rarity}
      tags={detail?.tags?.(item)}
      guides={view.concealed ? [] : guideLinks(source, { gameTitle, title: detail?.guideTitle?.(item) ?? row.title, appId: gameId })}
      pinned={view.pinned}
      onTogglePin={view.onTogglePin}
      showcase={
        row.earned && row.earnedAt
          ? { source, gameId, achievementKey: row.id, gameTitle, title: row.title, description: row.description || null, badge: row.iconUrl, earnedAt: row.earnedAt }
          : null
      }
      onClose={onClose}
    />
  )
}
