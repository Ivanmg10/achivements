import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import {
  RANK_PERIODS,
  RANK_SCOPES,
  RANK_SOURCES,
  loadRanking,
  presenceOf,
  weekStartRanks,
  weeklyTrend,
  type RankEntry,
  type RankPeriod,
  type RankScope,
  type RankSource,
} from '@/lib/rankings'
import { canUseXbox } from '@/utils/xboxAccess'

/** The list comes thirty at a time: the top, then more on demand. */
const PAGE = 30
/** Places shown on each side of the viewer in "your zone" at first, and the most it can widen to. */
const ZONE = 2
const ZONE_MAX = 50

export type RankRow = Omit<RankEntry, 'id' | 'listed'> & {
  /** Places moved since Monday (positive: up); null when unknown or not this view. */
  delta: number | null
  isMe: boolean
  /** Points in each of the last weeks (TREND_WEEKS), oldest first, on the chosen platforms. */
  trend: number[]
  /** Only for signed-in viewers, and never about the viewer themselves. */
  online?: boolean
  lastSeenAt?: string | null
}

export type RankingsResponse = {
  scope: RankScope
  period: RankPeriod
  source: RankSource
  /** How many are listed. */
  total: number
  offset: number
  rows: RankRow[]
  /** The viewer's own standing; null signed out or with nothing scored. */
  me: (RankRow & { listed: boolean }) | null
  /** "Your zone": the viewer and who stands just above and below, in order (empty when they are not listed). */
  zone: RankRow[]
  /** The place in the list (0-based) of the zone's first row, to tell where it meets the list above. */
  zoneStart: number
  /** Whether `delta` is filled in (only the global, all-time, every-platform view). */
  arrows: boolean
}

/** A count from the query string, within 0…max; the default when absent; null when not a number. */
function count(value: string | null, fallback: number, max: number): number | null {
  if (value === null) return fallback
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? Math.min(n, max) : null
}

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T | null {
  if (value === null) return fallback
  return (allowed as readonly string[]).includes(value) ? (value as T) : null
}

/**
 * The rankings: everyone, or you and whom you follow; all time, this month or
 * this week; every platform or one. Public: signed out, only the global list,
 * and no presence. Usernames and avatars only — never ids, never emails.
 * `offset` pages the list; `above`/`below` widen the viewer's zone.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const scope = pick(params.get('scope'), RANK_SCOPES, 'global')
  const period = pick(params.get('period'), RANK_PERIODS, 'all')
  const source = pick(params.get('source'), RANK_SOURCES, 'all')
  const offset = Number(params.get('offset') ?? 0)
  const above = count(params.get('above'), ZONE, ZONE_MAX)
  const below = count(params.get('below'), ZONE, ZONE_MAX)
  if (!scope || !period || !source || !Number.isInteger(offset) || offset < 0 || above === null || below === null) {
    return NextResponse.json({ error: 'invalid-params' }, { status: 400 })
  }

  try {
    const session = await getServerSession(authOptions)
    const viewerId = session?.user?.id ? Number(session.user.id) : null
    if (scope === 'following' && viewerId === null) return NextResponse.json({ error: 'sign-in-required' }, { status: 401 })
    // Xbox is admin-only for now: to anyone else it is not there at all.
    const xbox = canUseXbox(session?.user?.admin)
    if (source === 'xbox' && !xbox) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const entries = await loadRanking({ scope, period, source, viewerId, xbox })
    const listed = entries.filter((e) => e.listed)
    const own = viewerId === null ? undefined : entries.find((e) => e.id === viewerId)

    const arrowView = scope === 'global' && period === 'all' && source === 'all'
    const before = arrowView ? await weekStartRanks() : null
    // Before the first Monday snapshot everyone would read as new: no arrows until there is one.
    const arrows = arrowView && before !== null && before.size > 0
    const page = listed.slice(offset, offset + PAGE)
    const myIndex = own?.listed ? listed.indexOf(own) : -1
    const zoneStart = Math.max(0, myIndex - above)
    const zone = myIndex < 0 ? [] : listed.slice(zoneStart, myIndex + below + 1)

    const shown = [...new Set([...page, ...zone, ...(own ? [own] : [])])]
    const [presence, trend] = await Promise.all([
      viewerId === null ? null : presenceOf(shown.filter((e) => e.id !== viewerId).map((e) => e.id)),
      weeklyTrend(shown.map((e) => e.id), source, xbox),
    ])

    const toRow = (e: RankEntry): RankRow => {
      const { id, listed: _listed, ...rest } = e
      void _listed
      const was = before?.get(id)
      const p = presence?.get(id)
      return {
        ...rest,
        delta: arrows && e.listed ? (was === undefined ? null : was - e.rank) : null,
        isMe: id === viewerId,
        trend: trend.get(id) ?? [],
        ...(p ? { online: p.online, lastSeenAt: p.lastSeenAt } : {}),
      }
    }

    const body: RankingsResponse = {
      scope,
      period,
      source,
      total: listed.length,
      offset,
      rows: page.map(toRow),
      me: own && own.points > 0 ? { ...toRow(own), listed: own.listed } : null,
      zone: zone.map(toRow),
      zoneStart,
      arrows,
    }
    // Never a shared cache: a signed-in answer carries the viewer and presence, and must not reach anyone else.
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } })
  } catch (err) {
    console.error('[rankings GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
