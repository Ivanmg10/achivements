import { useCallback, useState } from 'react'
import { adminFetch } from '@/utils/adminFetch'
import type { XboxAchievement, XboxGame } from '@/types/xbox'

/** One game's achievements in the admin Xbox explorer, asked for when its row is opened. */
export function useAdminXboxAchievements(xuid: string, game: Pick<XboxGame, 'titleId' | 'is360'>) {
  const [achievements, setAchievements] = useState<XboxAchievement[] | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ xuid, titleId: game.titleId, ...(game.is360 ? { is360: '1' } : {}) })
      const res = await adminFetch(`/api/admin/xbox/achievements?${params}`)
      if (!res.ok) throw new Error(`Xbox achievements ${res.status}`)
      setAchievements(((await res.json()) as { achievements: XboxAchievement[] }).achievements)
    } catch (err) {
      console.error('[useAdminXboxAchievements] load', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [xuid, game.titleId, game.is360])

  return { achievements, error, loading, load }
}
