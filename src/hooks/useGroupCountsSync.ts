import { useEffect, useRef } from 'react'
import type { GameGroupItem } from '@/types/types'
import { isRa, itemKey, type ItemProgress, type PtsStats } from '@/utils/groupItems'

export type CountsUpdate = { source: string; game_id: number; num_awarded: number; max_possible: number; points_won: number; max_points: number }

/** Saves a group's stored counts (what the groups list reads). Only a cached copy: a failure is logged, the page already shows the fresh numbers. */
export function saveGroupCounts(groupId: number, updates: CountsUpdate[]) {
  fetch(`/api/groups/${groupId}/games`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
    .then((r) => {
      if (!r.ok) throw new Error(`sync ${r.status}`)
    })
    .catch((err) => console.error('[useGroupCountsSync] save', err))
}

/**
 * Keeps the stored counts of a group's games the same as the page shows them (`useGroupProgress`: RA's live lists,
 * the Steam, PSN and Xbox libraries), so the groups list, which reads the stored copy, says what the group page says
 * (#168 B1). A game is sent when its live numbers differ from the stored ones, once per value per visit, as each
 * platform's library comes in.
 */
export function useGroupCountsSync(
  groupId: number,
  items: GameGroupItem[],
  progress: (item: GameGroupItem) => ItemProgress,
  raPoints: Map<number, PtsStats>,
) {
  const sent = useRef(new Map<string, string>())

  useEffect(() => {
    const updates: CountsUpdate[] = []
    for (const item of items) {
      const now = progress(item)
      // A live entry with no total (an Xbox game whose count Xbox does not say) has nothing to store.
      if (now.total <= 0 || now.earned > now.total) continue
      if (now.earned === item.num_awarded && now.total === item.max_possible) continue
      const key = itemKey(item)
      const value = `${now.earned}/${now.total}`
      if (sent.current.get(key) === value) continue
      sent.current.set(key, value)
      const pts = isRa(item) ? raPoints.get(item.game_id) : undefined
      const points = pts && pts.earned <= pts.total ? pts : { earned: item.points_won, total: item.max_points }
      updates.push({
        source: item.source ?? 'ra',
        game_id: item.game_id,
        num_awarded: now.earned,
        max_possible: now.total,
        points_won: points.earned,
        max_points: points.total,
      })
    }
    if (updates.length) saveGroupCounts(groupId, updates)
  }, [groupId, items, progress, raPoints])
}
