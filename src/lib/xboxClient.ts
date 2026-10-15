import { NextResponse } from 'next/server'
import { withSteamCache } from '@/lib/steamCache'
import {
  sortByLastPlayed,
  toXbox360Achievement,
  toXboxAchievement,
  toXboxGame,
  toXboxProfile,
  type Raw360Achievement,
  type RawAchievement,
  type RawProfileUser,
  type RawTitle,
} from '@/utils/xboxMappers'
import type { XboxAchievement, XboxGame, XboxProfile } from '@/types/xbox'

/**
 * Xbox Live through OpenXBL (xbl.io), an unofficial proxy. Every call is made
 * as the ONE account behind OPENXBL_API_KEY — like PSN's NPSSO and Steam's
 * key, not per user — so it reads what that account may see (public
 * profiles). The key is server-only. The free plan allows 150 calls an hour
 * for the whole app, which is why everything is cached in `steam_cache`, under
 * keys starting "xbox:".
 *
 * Two things OpenXBL does that a plain fetch wrapper would miss, both
 * measured against the real API:
 * - It answers errors with HTTP 200 and the real status inside the body
 *   (`{ "code": 400, "content": … }`), so the body's code is checked too.
 * - It refuses `Accept-Language: *`, which is what Node's fetch sends by
 *   default, so a language is always sent.
 */

const BASE_URL = 'https://api.xbl.io/v2'
const LANGUAGE = 'en-US'
const PROFILE_TTL_MS = 60 * 60 * 1000
const LIBRARY_TTL_MS = 15 * 60 * 1000
const ACHIEVEMENTS_TTL_MS = 30 * 60 * 1000

/** Modern gamertags are 12 characters, old ones 15; letters, digits and spaces, with an optional #1234 suffix. */
const GAMERTAG = /^[A-Za-z0-9 ]{1,15}(#\d{1,4})?$/
const XUID = /^\d{10,20}$/
const TITLE_ID = /^\d{1,10}$/

export function isGamertag(value: unknown): value is string {
  return typeof value === 'string' && GAMERTAG.test(value.trim())
}
export function isXuid(value: unknown): value is string {
  return typeof value === 'string' && XUID.test(value)
}
export function isTitleId(value: unknown): value is string {
  return typeof value === 'string' && TITLE_ID.test(value)
}

export type XboxErrorKind = 'not-configured' | 'unauthorized' | 'private' | 'not-found' | 'rate-limited' | 'failed'

export class XboxError extends Error {
  constructor(readonly kind: XboxErrorKind, message: string) {
    super(message)
  }
}

/** The calls left this hour, as OpenXBL last reported. Per server instance, so a hint and not a count. */
let lastRateLimit: { remaining: number; limit: number } | null = null

export function xboxRateLimit() {
  return lastRateLimit
}

export function xboxConfigured(): boolean {
  return Boolean(process.env.OPENXBL_API_KEY?.trim())
}

function kindOf(status: number): XboxErrorKind {
  if (status === 401) return 'unauthorized'
  // ponytail: 403 → private is a guess; confirm with a private profile before trusting it
  if (status === 403) return 'private'
  if (status === 404) return 'not-found'
  if (status === 429) return 'rate-limited'
  return 'failed'
}

/** One OpenXBL call, unwrapped. Throws an XboxError for anything but a real answer. */
export async function xboxCall<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<T> {
  const key = process.env.OPENXBL_API_KEY?.trim()
  if (!key) throw new XboxError('not-configured', 'OPENXBL_API_KEY is not set')

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'X-Authorization': key,
        Accept: 'application/json',
        'Accept-Language': LANGUAGE,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    })
  } catch (err) {
    throw new XboxError('failed', `OpenXBL unreachable: ${err instanceof Error ? err.message : String(err)}`)
  }

  const remaining = Number(res.headers.get('x-ratelimit-remaining'))
  const limit = Number(res.headers.get('x-ratelimit-limit'))
  if (res.headers.get('x-ratelimit-remaining') !== null && Number.isFinite(remaining)) {
    lastRateLimit = { remaining, limit: Number.isFinite(limit) ? limit : 150 }
  }

  const body = (await res.json().catch(() => null)) as { code?: number; content?: unknown } | null
  if (!res.ok) throw new XboxError(kindOf(res.status), `OpenXBL answered ${res.status}`)
  if (!body || typeof body !== 'object') throw new XboxError('failed', 'OpenXBL sent something that is not JSON')
  if (typeof body.code === 'number' && body.code >= 400) throw new XboxError(kindOf(body.code), `OpenXBL answered ${body.code} in the body`)
  return body.content as T
}

/** The account with exactly this gamertag, or null. One call tells the XUID and the profile. */
export async function findXboxAccount(gamertag: string): Promise<XboxProfile | null> {
  const name = gamertag.trim()
  return withSteamCache<XboxProfile | null>(
    `xbox:account:v1:${name.toLowerCase()}`,
    PROFILE_TTL_MS,
    async () => {
      const res = await xboxCall<{ profileUsers?: RawProfileUser[] }>(`friends/search?gt=${encodeURIComponent(name)}`)
      return toXboxProfile(res?.profileUsers?.[0])
    },
    // A "not found" is cheap to ask again and would otherwise stick for an hour after the account is made.
    { shouldCache: (profile) => profile !== null },
  )
}

/** Every game in an account's library, most recently played first. One call, no paging (135 games in one answer). */
export async function xboxLibrary(xuid: string): Promise<XboxGame[]> {
  return withSteamCache(
    `xbox:titles:v1:${xuid}`,
    LIBRARY_TTL_MS,
    async () => {
      const res = await xboxCall<{ titles?: RawTitle[] }>(`titles/${xuid}`)
      return sortByLastPlayed((res?.titles ?? []).map(toXboxGame))
    },
    { refreshable: true },
  )
}

/**
 * A game's achievements with what the account earned of them, in one call
 * (Xbox 360 games use another endpoint with another shape).
 */
export async function xboxAchievements(xuid: string, titleId: string, is360: boolean): Promise<XboxAchievement[]> {
  return withSteamCache(
    `xbox:achievements:v1:${xuid}:${titleId}:${is360 ? '360' : 'one'}`,
    ACHIEVEMENTS_TTL_MS,
    async () => {
      if (is360) {
        const res = await xboxCall<{ achievements?: Raw360Achievement[] }>(`achievements/x360/${xuid}/title/${titleId}`)
        return (res?.achievements ?? []).map(toXbox360Achievement)
      }
      const res = await xboxCall<{ achievements?: RawAchievement[] }>(`achievements/player/${xuid}/${titleId}`)
      return (res?.achievements ?? []).map(toXboxAchievement)
    },
  )
}

/** The response for an Xbox call that threw: 503 with no key (or a refused one), 403 hidden, 404 no such gamertag, 429 over the hour's limit, 502 anything else. */
export function xboxFailure(err: unknown, where: string): NextResponse {
  if (err instanceof XboxError) {
    if (err.kind === 'not-configured') return NextResponse.json({ error: 'not-configured' }, { status: 503 })
    if (err.kind === 'unauthorized') {
      console.error(`[${where}]`, err)
      return NextResponse.json({ error: 'unauthorized' }, { status: 503 })
    }
    if (err.kind === 'private') return NextResponse.json({ error: 'private' }, { status: 403 })
    if (err.kind === 'not-found') return NextResponse.json({ error: 'not-found' }, { status: 404 })
    if (err.kind === 'rate-limited') {
      return NextResponse.json({ error: 'rate-limited' }, { status: 429, headers: { 'Retry-After': '60' } })
    }
  }
  console.error(`[${where}]`, err)
  return NextResponse.json({ error: 'failed' }, { status: 502 })
}
