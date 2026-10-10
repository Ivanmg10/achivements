import { NextResponse } from 'next/server'
import { dataOwner } from '@/lib/apiAuth'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { getUserRecentAchievements } from '@/lib/raClient'

const TTL = 60 * 1000

function sortDesc(arr: { Date: string }[]) {
  return [...arr].sort(
    (a, b) =>
      new Date(b.Date.replace(' ', 'T')).getTime() -
      new Date(a.Date.replace(' ', 'T')).getTime(),
  )
}

function normalizeRaw(raw: unknown): { Date: string }[] {
  if (Array.isArray(raw)) return sortDesc(raw as { Date: string }[])
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj?.Results)) return sortDesc(obj.Results as { Date: string }[])
  if (Array.isArray(obj?.Data)) return sortDesc(obj.Data as { Date: string }[])
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
    const data = await withCache(
      `recentAch_v2:${id}`,
      TTL,
      async () => {
        const raw = await getUserRecentAchievements(rausername, raid, 20160, 500)
        return normalizeRaw(raw)
      },
      (d) => Array.isArray(d),
      { refreshable: true },
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
