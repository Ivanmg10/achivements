import { NextResponse } from 'next/server'
import { withSteamCache } from '@/lib/steamCache'
import { allowAttempt } from '@/lib/attemptLimit'
import { recordXboxCacheEvent, recordXboxPartial, recordXboxUpstream, recordXboxUpstreamSkip, xboxOperation, xboxStaleVersion } from '@/lib/xboxTelemetry'
import { foldTwinTitles, isXboxTitleId } from '@/utils/xboxTitles'
import {
  sortByLastPlayed,
  merge360Achievements,
  parseXboxMinutes,
  xboxStatsTitleId,
  toXboxAchievement,
  toXboxGame,
  toXboxProfile,
  type Raw360Achievement,
  type RawAchievement,
  type RawProfileUser,
  type RawTitle,
} from '@/utils/xboxMappers'
import type { XboxAchievement, XboxGameProgress, XboxProfile, XboxRecentAchievement, XboxSummary } from '@/types/xbox'
import { withXboxCompletionDates } from '@/lib/xboxCompletion'

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
 *   default, so a language is always sent. It also translates achievement
 *   texts by it.
 */

const BASE_URL = 'https://api.xbl.io/v2'
const DEFAULT_LANGUAGE = 'en-US'
const UPSTREAM_TIMEOUT_MS = 5000
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000
/** The language tags for the app's languages. */
const LANGUAGES: Record<string, string> = {
  en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', ja: 'ja-JP', pl: 'pl-PL', pt: 'pt-PT', ru: 'ru-RU',
}
const PROFILE_TTL_MS = 60 * 60 * 1000
const SUMMARY_TTL_MS = 15 * 60 * 1000
const LIBRARY_TTL_MS = 15 * 60 * 1000
/**
 * A game's achievements are keyed by when it was last played: they can only
 * change when it is, which changes the key. So an entry for a game not played
 * since is still right a month later — the same idea as PSN's settled trophies.
 */
const SETTLED_ACHIEVEMENTS_TTL_MS = 30 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
/**
 * How many games are asked of OpenXBL at once when a feed is built game by game.
 * Few: the hour's 150 calls are for the whole app.
 */
const PARALLEL = 3
/** How many of the latest games the profile column's "recent achievements" look through. */
const LATEST_GAMES = 3
/**
 * The most games a time window scans cold (one call each). Past it the oldest
 * are left out, so one page load cannot spend the hour's calls; once a game is
 * cached it costs nothing until it is played again.
 */
const MAX_SCAN_GAMES = { activity: 20, year: 40 } as const
const FEED_TTL_MS = { recent: 2 * 60 * 1000, activity: 5 * 60 * 1000, year: 30 * 60 * 1000 } as const

/** Modern gamertags are 12 characters, old ones 15; letters, digits and spaces, with an optional #1234 suffix. */
const GAMERTAG = /^[A-Za-z0-9 ]{1,15}(#\d{1,4})?$/
const XUID = /^\d{10,20}$/

export function isGamertag(value: unknown): value is string {
  return typeof value === 'string' && GAMERTAG.test(value.trim())
}
export function isXuid(value: unknown): value is string {
  return typeof value === 'string' && XUID.test(value)
}
export function isTitleId(value: unknown): value is string {
  return isXboxTitleId(typeof value === 'string' ? value : '')
}

/** The Accept-Language OpenXBL is asked in, from the app's language code. Unknown codes get English. */
export function xboxLanguage(lang: string | null | undefined): string {
  return (lang && LANGUAGES[lang]) || DEFAULT_LANGUAGE
}

export type XboxErrorKind = 'not-configured' | 'unauthorized' | 'private' | 'not-found' | 'rate-limited' | 'timeout' | 'failed'

export class XboxError extends Error {
  constructor(readonly kind: XboxErrorKind, message: string) {
    super(message)
  }
}

function withXboxCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options: { userId?: string | null; shouldCache?: (data: T) => boolean; refreshable?: boolean; staleOnRateLimit?: boolean } = {},
): Promise<T> {
  const { staleOnRateLimit = true, ...cacheOptions } = options
  const staleAtStart = xboxStaleVersion()
  return withSteamCache(key, ttlMs, fetcher, {
    ...cacheOptions,
    staleIfError: (err) => err instanceof XboxError && (err.kind === 'failed' || err.kind === 'timeout' || (staleOnRateLimit && err.kind === 'rate-limited')),
    staleResult: () => xboxStaleVersion() > staleAtStart,
    onEvent: recordXboxCacheEvent,
  })
}

/** The calls left this hour, as OpenXBL last reported. Per server instance, so a hint and not a count. */
let lastRateLimit: { remaining: number; limit: number } | null = null
let rateLimitedUntil = 0

export function xboxRateLimit() {
  return lastRateLimit
}

/** Clears module-local observations between isolated tests. */
export function resetXboxCallState() {
  lastRateLimit = null
  rateLimitedUntil = 0
}

function rateLimitDelay(reset: string | null): number {
  if (!reset) return RATE_LIMIT_COOLDOWN_MS
  const numeric = Number(reset)
  const resetMs = Number.isFinite(numeric) ? (numeric > 1_000_000_000_000 ? numeric : numeric * 1000) : Date.parse(reset)
  if (!Number.isFinite(resetMs)) return RATE_LIMIT_COOLDOWN_MS
  return Math.max(1000, Math.min(60 * 60 * 1000, resetMs - Date.now()))
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
export async function xboxCall<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; language?: string } = {},
): Promise<T> {
  const key = process.env.OPENXBL_API_KEY?.trim()
  if (!key) throw new XboxError('not-configured', 'OPENXBL_API_KEY is not set')
  const operation = xboxOperation(path)
  if (Date.now() < rateLimitedUntil) {
    recordXboxUpstreamSkip(operation, 'rate-limited')
    throw new XboxError('rate-limited', 'OpenXBL is in its rate-limit cooldown')
  }
  if (!(await allowAttempt('xbox-upstream', 'app'))) {
    recordXboxUpstreamSkip(operation, 'rate-limited')
    throw new XboxError('rate-limited', 'The app OpenXBL hourly budget is exhausted')
  }

  const startedAt = Date.now()
  let res: Response
  try {
    res = await fetch(`${BASE_URL}/${path}`, {
      method: init.method ?? 'GET',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: {
        'X-Authorization': key,
        Accept: 'application/json',
        'Accept-Language': init.language ?? DEFAULT_LANGUAGE,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    })
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    const kind = timedOut ? 'timeout' : 'failed'
    recordXboxUpstream(operation, kind, Date.now() - startedAt)
    throw new XboxError(kind, timedOut ? 'OpenXBL timed out' : 'OpenXBL is unreachable')
  }

  const remainingHeader = res.headers.get('x-ratelimit-remaining')
  const limitHeader = res.headers.get('x-ratelimit-limit')
  const reset = res.headers.get('x-ratelimit-reset')
  const remaining = Number(remainingHeader)
  const limit = limitHeader === null ? 150 : Number(limitHeader)
  const rateLimit = {
    ...(remainingHeader !== null && Number.isFinite(remaining) ? { remaining, limit: Number.isFinite(limit) ? limit : 150 } : {}),
    ...(reset ? { reset } : {}),
  }
  if (remainingHeader !== null && Number.isFinite(remaining)) {
    lastRateLimit = { remaining, limit: Number.isFinite(limit) ? limit : 150 }
  }

  let body: { code?: number; content?: unknown } | null
  try {
    body = (await res.json()) as { code?: number; content?: unknown }
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    const kind = timedOut ? 'timeout' : 'failed'
    recordXboxUpstream(operation, kind, Date.now() - startedAt, rateLimit)
    throw new XboxError(kind, timedOut ? 'OpenXBL timed out reading the response' : 'OpenXBL sent something that is not JSON')
  }
  if (res.status === 429 || body?.code === 429) rateLimitedUntil = Date.now() + rateLimitDelay(reset)
  if (!res.ok) {
    const kind = kindOf(res.status)
    recordXboxUpstream(operation, kind, Date.now() - startedAt, rateLimit)
    throw new XboxError(kind, `OpenXBL answered ${res.status}`)
  }
  if (!body || typeof body !== 'object') {
    recordXboxUpstream(operation, 'failed', Date.now() - startedAt, rateLimit)
    throw new XboxError('failed', 'OpenXBL sent something that is not JSON')
  }
  if (typeof body.code === 'number' && body.code >= 400) {
    const kind = kindOf(body.code)
    recordXboxUpstream(operation, kind, Date.now() - startedAt, rateLimit)
    throw new XboxError(kind, `OpenXBL answered ${body.code} in the body`)
  }
  recordXboxUpstream(operation, 'success', Date.now() - startedAt, rateLimit)
  return body.content as T
}

/** The account with exactly this gamertag, or null. One call tells the XUID and the profile. */
export async function findXboxAccount(gamertag: string): Promise<XboxProfile | null> {
  const name = gamertag.trim()
  return withXboxCache<XboxProfile | null>(
    `xbox:account:v2:${name.toLowerCase()}`,
    PROFILE_TTL_MS,
    async () => {
      const res = await xboxCall<{ profileUsers?: RawProfileUser[] }>(`friends/search?gt=${encodeURIComponent(name)}`)
      return toXboxProfile(res?.profileUsers?.[0])
    },
    // A "not found" is cheap to ask again and would otherwise stick for an hour after the account is made.
    { shouldCache: (profile) => profile !== null },
  )
}

/** OpenXBL took 135 titles in one stats call; a bigger library is split so no call is ever refused for its size. */
const STATS_CHUNK = 150
/**
 * Play time is asked for the most recently played games only: a library can hold
 * 1000 titles (a public one was measured at that), which would be 7 calls of the
 * hour's 150 for hours nobody looks at. Older games just show none.
 */
const MAX_STATS_TITLES = 300

/**
 * Minutes played per game (by its own title id), in one stats call per 150
 * titles. Play time is an extra: if the call fails the library goes on without
 * it (and says so in the log), rather than losing the whole list.
 */
async function xboxPlaytimes(xuid: string, titles: RawTitle[]): Promise<{ minutes: Map<string, number>; complete: boolean }> {
  const owners = new Map<string, string[]>()
  const recent = [...titles]
    .sort((a, b) => (b.titleHistory?.lastTimePlayed ?? '').localeCompare(a.titleHistory?.lastTimePlayed ?? ''))
    .slice(0, MAX_STATS_TITLES)
  for (const t of recent) {
    const statsId = xboxStatsTitleId(t)
    if (statsId) owners.set(statsId, [...(owners.get(statsId) ?? []), String(t.titleId)])
  }
  const ids = [...owners.keys()]
  const result = new Map<string, number>()
  let complete = true
  for (let i = 0; i < ids.length; i += STATS_CHUNK) {
    try {
      const content = await xboxCall<unknown>('player/stats', {
        method: 'POST',
        body: { xuids: [xuid], stats: ids.slice(i, i + STATS_CHUNK).map((titleId) => ({ name: 'MinutesPlayed', titleId })) },
      })
      for (const [statsId, minutes] of parseXboxMinutes(content)) {
        for (const titleId of owners.get(statsId) ?? []) result.set(titleId, minutes)
      }
    } catch (err) {
      complete = false
      recordXboxPartial('playtime')
      console.error('[xbox] play time', err)
    }
  }
  return { minutes: result, complete }
}

export type XboxLibraryData = { games: XboxGameProgress[]; achievementsUnlocked: number; playtimeComplete: boolean }

/**
 * Every game in an account's library, most recently played first, with how
 * many achievements the whole library has unlocked. One call, no paging (135
 * games in one answer).
 */
export async function xboxLibraryData(xuid: string, userId: string | null = null): Promise<XboxLibraryData> {
  const data = await withXboxCache(
    `xbox:titles:v7:${xuid}`,
    LIBRARY_TTL_MS,
    async () => {
      const res = await xboxCall<{ titles?: RawTitle[]; achievementSummary?: { totalAchievementsUnlocked?: number } }>(`titles/${xuid}`)
      const titles = res?.titles ?? []
      // Measured 2026-10-16: a library the viewer cannot read answers like an account that does not exist,
      // `titles: []` with no `achievementSummary`; a public account with no games still has the summary.
      if (titles.length === 0 && !res?.achievementSummary) throw new XboxError('private', 'The Xbox library is not readable')
      const playtime = await xboxPlaytimes(xuid, titles)
      const games: XboxGameProgress[] = []
      for (const t of titles) {
        const game = toXboxGame(t)
        if (game) games.push({ ...game, playtimeMinutes: playtime.minutes.get(game.titleId) ?? null })
      }
      // A launcher title beside its game (same name, no achievements) is not a second game.
      return {
        games: sortByLastPlayed(foldTwinTitles(games)),
        achievementsUnlocked: res?.achievementSummary?.totalAchievementsUnlocked ?? 0,
        playtimeComplete: playtime.complete,
      }
    },
    { userId, refreshable: true },
  )
  if (!data.playtimeComplete) recordXboxPartial('playtime')
  return data
}

export async function xboxLibrary(xuid: string, userId: string | null = null): Promise<XboxGameProgress[]> {
  return (await xboxLibraryData(xuid, userId)).games
}

/** Library DTO with full-set completion dates; raw title/activity caches keep their existing shape and keys. */
export async function xboxTitlesWithCompletion(xuid: string, userId: string | null = null): Promise<XboxGameProgress[]> {
  const games = await xboxLibrary(xuid, userId)
  return withXboxCompletionDates(games, (game) => xboxGameAchievements(xuid, game, userId))
}

/** A game of the account's by its title id, or null when it is not in their library. */
export async function findXboxGame(xuid: string, titleId: string, userId: string | null = null): Promise<XboxGameProgress | null> {
  return (await xboxLibrary(xuid, userId)).find((g) => g.titleId === titleId) ?? null
}

/**
 * The headline numbers for one account. The gamertag is the one saved when the
 * account was linked; if its owner has renamed since, the search finds someone
 * else (or no one) and the summary says not-found rather than showing the wrong person.
 */
export async function xboxSummary(xuid: string, gamertag: string, userId: string | null = null): Promise<XboxSummary> {
  return withXboxCache(
    `xbox:summary:v1:${xuid}`,
    SUMMARY_TTL_MS,
    async () => {
      const profile = await findXboxAccount(gamertag)
      if (!profile || profile.xuid !== xuid) throw new XboxError('not-found', 'No matching Xbox account under the linked gamertag')
      const library = await xboxLibraryData(xuid, userId)
      return {
        gamertag: profile.gamertag,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        tier: profile.tier,
        gamerscore: profile.gamerscore,
        achievementsUnlocked: library.achievementsUnlocked,
        games: library.games.length,
      }
    },
    { userId, refreshable: true },
  )
}

/**
 * A game's achievements with what the account earned of them, in one call
 * (Xbox 360 games take two, with another shape), its texts in
 * `language`. Cached until the game is played again (see SETTLED_ACHIEVEMENTS_TTL_MS).
 */
export async function xboxGameAchievements(
  xuid: string,
  game: Pick<XboxGameProgress, 'titleId' | 'is360' | 'lastPlayed'>,
  userId: string | null = null,
  language = DEFAULT_LANGUAGE,
  staleOnRateLimit = true,
): Promise<XboxAchievement[]> {
  return withXboxCache(
    `xbox:achievements:v5:${xuid}:${game.titleId}:${game.lastPlayed ?? ''}:${language}`,
    SETTLED_ACHIEVEMENTS_TTL_MS,
    async () => {
      if (game.is360) {
        // Two calls: the title's whole list, and what the account unlocked of it.
        const [all, earned] = await Promise.all([
          xboxCall<{ achievements?: Raw360Achievement[] }>(`achievements/player/${xuid}/title/${game.titleId}`, { language }),
          xboxCall<{ achievements?: Raw360Achievement[] }>(`achievements/x360/${xuid}/title/${game.titleId}`, { language }),
        ])
        return merge360Achievements(all?.achievements ?? [], earned?.achievements ?? [])
      }
      const res = await xboxCall<{ achievements?: RawAchievement[] }>(`achievements/player/${xuid}/${game.titleId}`, { language })
      return (res?.achievements ?? []).map(toXboxAchievement)
    },
    { userId, staleOnRateLimit },
  )
}

function toRecent(game: XboxGameProgress, a: XboxAchievement & { unlockedAt: string }): XboxRecentAchievement {
  return {
    gameId: game.id,
    titleId: game.titleId,
    gameTitle: game.title,
    gameIconUrl: game.imageIcon,
    achievementId: a.id,
    name: a.name,
    iconUrl: a.iconUrl,
    gamerscore: a.gamerscore,
    earnedAt: a.unlockedAt,
    rarity: a.rarity,
  }
}

type XboxFeed = { achievements: XboxRecentAchievement[]; partial: boolean }

/** Achievements earned on or after `since` (ISO; '' for all) across `games`, newest first, a few games at a time. */
async function earnedSince(
  xuid: string,
  games: XboxGameProgress[],
  since: string,
  userId: string | null,
  language: string,
): Promise<XboxFeed> {
  const lists: PromiseSettledResult<XboxAchievement[]>[] = new Array(games.length)
  let next = 0
  let rateLimited: XboxError | null = null
  async function worker() {
    while (next < games.length && !rateLimited) {
      const i = next++
      try {
        lists[i] = { status: 'fulfilled', value: await xboxGameAchievements(xuid, games[i], userId, language, false) }
      } catch (reason) {
        lists[i] = { status: 'rejected', reason }
        if (reason instanceof XboxError && reason.kind === 'rate-limited') rateLimited = reason
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLEL, games.length) }, worker))
  // Quota exhaustion makes the feed incomplete: stop new work and let the route report it.
  if (rateLimited) throw rateLimited

  const unlocks: XboxRecentAchievement[] = []
  lists.forEach((list, i) => {
    // One game failing leaves it out of the feed rather than failing the feed.
    if (list.status === 'rejected') return console.error('[xbox] achievements for the feed', games[i].titleId, list.reason)
    for (const a of list.value) {
      if (a.unlocked && a.unlockedAt && a.unlockedAt >= since) unlocks.push(toRecent(games[i], { ...a, unlockedAt: a.unlockedAt }))
    }
  })
  // Nothing at all came back: that is a failure, not an empty feed.
  if (games.length > 0 && lists.every((l) => l.status === 'rejected')) throw (lists[0] as PromiseRejectedResult).reason
  return {
    achievements: unlocks.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)),
    partial: lists.some((list) => list.status === 'rejected'),
  }
}

/** Only games with something earned can hold a recent achievement. */
const hasEarned = (g: XboxGameProgress) => g.numAwarded > 0 || g.earnedGamerscore > 0

async function cachedFeed(key: string, ttlMs: number, userId: string | null, build: () => Promise<XboxFeed>): Promise<XboxRecentAchievement[]> {
  const feed = await withXboxCache(key, ttlMs, build, { userId })
  if (feed.partial) recordXboxPartial('achievements')
  return feed.achievements
}

/**
 * The latest achievements, however long ago they were earned — from the last
 * few games played, for the profile column. Newest first.
 */
export async function xboxLatestAchievements(
  xuid: string,
  userId: string | null = null,
  language = DEFAULT_LANGUAGE,
): Promise<XboxRecentAchievement[]> {
  const library = await xboxLibrary(xuid, userId)
  const games = library.filter(hasEarned).slice(0, LATEST_GAMES)
  const fingerprint = library[0]?.lastPlayed ?? ''
  return cachedFeed(
    `xbox:feed:v2:${xuid}:recent:${fingerprint}:${language}`,
    FEED_TTL_MS.recent,
    userId,
    () => earnedSince(xuid, games, '', userId, language),
  )
}

/**
 * Every achievement earned in the last `days` days, newest first. Xbox has no
 * feed for this, so it is built from the games played in the window: one call
 * per such game (at most MAX_SCAN_GAMES of the most recent), each cached until
 * that game is played again.
 */
export async function xboxRecentAchievements(
  xuid: string,
  scope: keyof typeof MAX_SCAN_GAMES,
  days: number,
  userId: string | null = null,
  language = DEFAULT_LANGUAGE,
): Promise<XboxRecentAchievement[]> {
  const since = new Date(Date.now() - days * DAY_MS).toISOString()
  const library = await xboxLibrary(xuid, userId)
  const games = library
    .filter((g) => hasEarned(g) && g.lastPlayed && g.lastPlayed >= since)
    .slice(0, MAX_SCAN_GAMES[scope])
  const fingerprint = library[0]?.lastPlayed ?? ''
  return cachedFeed(
    `xbox:feed:v2:${xuid}:${scope}:${days}:${fingerprint}:${language}`,
    FEED_TTL_MS[scope],
    userId,
    () => earnedSince(xuid, games, since, userId, language),
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
    if (err.kind === 'timeout') return NextResponse.json({ error: 'timeout' }, { status: 504 })
  }
  console.error(`[${where}]`, err)
  return NextResponse.json({ error: 'failed' }, { status: 502 })
}
