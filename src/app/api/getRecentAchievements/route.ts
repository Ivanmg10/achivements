import { raUnavailable } from '@/lib/raFailure'
import { NextResponse } from 'next/server'
import { dataOwner } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getUserRecentAchievements } from '@/lib/raClient'
import { visibleGamesForUser } from '@/lib/gameVisibility'
import type { RecentAchievement } from '@/types/types'

const TTL = 60 * 1000

function sortDesc(arr: RecentAchievement[]) {
  return [...arr].sort(
    (a, b) =>
      new Date(b.Date.replace(' ', 'T')).getTime() -
      new Date(a.Date.replace(' ', 'T')).getTime(),
  )
}

function normalizeRaw(raw: unknown): RecentAchievement[] {
  if (Array.isArray(raw)) return sortDesc(raw as RecentAchievement[])
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj?.Results)) return sortDesc(obj.Results as RecentAchievement[])
  if (Array.isArray(obj?.Data)) return sortDesc(obj.Data as RecentAchievement[])
  return []
}

export async function GET(req?: Request) {
  const owner = await dataOwner(req)
  if (!owner) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  }

  const { rausername, raid, id } = owner
  if (!rausername || !raid) {
    return NextResponse.json([])
  }

  try {
    const data = await withCache<RecentAchievement[]>(
      `recentAch_v2:${id}`,
      TTL,
      async () => {
        const raw = await getUserRecentAchievements(rausername, raid, 20160, 500)
        return normalizeRaw(raw)
      },
      (d) => Array.isArray(d),
      { refreshable: true },
    )
    const visible = await visibleGamesForUser(id, data, 'ra', (achievement) => achievement.GameID)
    return cachedJson(visible, 0)
  } catch (err) {
    return raUnavailable(err)
  }
}
