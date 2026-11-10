'use client'

import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import type { GameSource } from '@/types/game'
import type { DetailBase } from '@/types/achievementTable'
import type { CompareAchievement } from '@/utils/gameCompare'
import { guideLinks } from '@/utils/guideLinks'

// Downloaded the first time it opens, not with the page.
const AchievementDetailModal = dynamic(() => import('@/components/achievement-detail-modal/AchievementDetailModal'), { loading: () => null })

/**
 * Steam's, PSN's and Xbox's detail window for a row: guide links (none for a
 * secret one still hidden: a search would give it away) and, once earned with
 * a date, the way into the showcase.
 */
export default function AchievementTableDetail({
  base: { concealed, ...base },
  row,
  source,
  gameId,
  gameTitle,
  tags,
  guideTitle,
}: {
  base: DetailBase
  row: CompareAchievement
  source: Exclude<GameSource, 'ra'>
  gameId: number
  gameTitle: string
  tags?: ReactNode
  /** The name guides are searched by (Steam's English one). */
  guideTitle: string
}) {
  return (
    <AchievementDetailModal
      {...base}
      tags={tags}
      guides={concealed ? [] : guideLinks(source, { gameTitle, title: guideTitle, appId: gameId })}
      showcase={
        row.earned && row.earnedAt
          ? { source, gameId, achievementKey: row.id, gameTitle, title: row.title, description: row.description || null, badge: row.iconUrl, earnedAt: row.earnedAt }
          : null
      }
    />
  )
}
