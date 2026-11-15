import { countUpstream } from '@/lib/upstreamCount'
import { recordPsnCall, type PsnFunction } from '@/lib/psnCallStats'
import { NextResponse } from 'next/server'
import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
  getProfileFromAccountId,
  getTitleTrophies,
  getTitleTrophyGroups,
  getUserPlayedGames,
  getUserTitles,
  getUserTrophiesEarnedForTitle,
  getUserTrophiesForSpecificTitle,
  getUserTrophyGroupEarningsForTitle,
  getUserTrophyProfileSummary,
  makeUniversalSearch,
  type AuthorizationPayload,
  type AuthTokensResponse,
  type TrophyTitle,
} from 'psn-api'
import { readCache, readCacheMany, withSteamCache, writeCache } from '@/lib/steamCache'
import { igdbArt, igdbConfigured, igdbPlatforms, type IgdbArt } from '@/lib/igdbClient'
import {
  loadPsnCredentials,
  npssoExpiry,
  savePsnNpsso,
  savePsnTokens,
  type PsnCredentials,
  type PsnTokens,
} from '@/lib/psnCredentials'
import { countTrophies, psnNumericId, psnPlatformName } from '@/utils/psnTitles'
import { mapLimit } from '@/utils/utils'
import type { PsnGameProgress, PsnRecentTrophy, PsnTrophy, PsnTrophyGroup, TrophyCounts } from '@/types/psn'
import { NOT_CONFIGURED, PsnBusyError, PsnError, PsnSyncing } from '@/lib/psnErrors'
import { psnRateLimited, takePsnCall } from '@/lib/psnBudget'
import { psnCached, psnSyncedAt } from '@/lib/psnCache'
import { needsBaseTrophies, withCompletion } from '@/lib/psnCompletion'
import { psnBaseCompletedAt } from '@/utils/completionDates'

export { PsnBusyError, PsnError, PsnSyncing } from '@/lib/psnErrors'

/**
 * PlayStation Network through psn-api, which speaks Sony's own (unofficial)
 * mobile API. Every call is authenticated as ONE account: the one whose NPSSO
 * token is in PSN_NPSSO — like Steam's server-wide key, not per user. That
 * account can read any profile whose trophies are public. Its NPSSO and
 * tokens live in the database (see psnCredentials), seeded once from
 * PSN_NPSSO and renewed from the admin panel.
 *
 * psn-api returns Sony's error bodies instead of throwing, so every response
 * goes through unwrap(). Every request spends the app's budget (psnBudget).
 * Responses are cached in the Steam cache table under "psn:" keys: the
 * account-level ones through psnCache (stale data, one fetch at a time), the
 * per-game ones split into what every player shares (a game's defined trophies
 * and groups, per language) and what is the account's (earned, keyed by the
 * game's last trophy).
 *
 * The library comes in two parts (#177): the core (the trophy list alone, one
 * request per 800 games) is what a page waits for; the enrichment (play time,
 * store art, IGDB, completion dates) is filled in the background, 20 games a
 * pass, and laid over the core when it is there.
 */

/** How long a rate-limited call waits before its one retry. Sony sends no Retry-After that psn-api lets through. */
const RATE_LIMIT_WAIT_MS = 2_000
/** psn-api takes no signal, so a hung call is left behind rather than aborted. */
const CALL_TIMEOUT_MS = 8_000
/** After Sony refuses twice, this instance does not ask again for this long (psnBudget tells the others). */
const COOLDOWN_MS = 60_000
const MARGIN_MS = 60_000
const SUMMARY_TTL_MS = 15 * 60 * 1000
const NOT_FOUND_TTL_MS = 60 * 60 * 1000
const TITLES_TTL_MS = 15 * 60 * 1000
/** Play data, store art and completion dates: background work, read again at most hourly. */
const ENRICHED_TTL_MS = 60 * 60 * 1000
/** The year of trophies: rebuilt from per-game entries, so a rebuild costs only the games that moved. */
const YEAR_TTL_MS = 15 * 60 * 1000
/**
 * A game's earned trophies are keyed by when its last trophy was earned: they can
 * only change when that does, which changes the key. So an entry for a game
 * not touched since is still right a month later — the same idea as Steam's
 * settledProgress.
 */
const SETTLED_TROPHIES_TTL_MS = 30 * 24 * 60 * 60 * 1000
/** A game's defined trophies and groups, the same for every player; a DLC added since is caught by its ids. */
const DEFINED_TTL_MS = 30 * 24 * 60 * 60 * 1000
/** The most titles Sony returns per page. */
const TITLES_PAGE = 800
/** The most played games Sony returns per page. */
const PLAYED_PAGE = 200
/** Sony refuses more than five ids per trophy-set lookup. */
const LOOKUP_BATCH = 5
/** A game's trophy sets never change, so the lookup is kept a long time. */
const LOOKUP_TTL_MS = 90 * 24 * 60 * 60 * 1000
/** How many games a background enrichment pass looks up (trophy sets, completion dates), most recent first. */
const ENRICH_GAMES = 20
const DAY_MS = 24 * 60 * 60 * 1000
/** The year's window, as the streak and the heatmap read it. */
const YEAR_DAYS = 366
/**
 * How many games are asked of Sony at once when a list is built game by game
 * (the streak's year, the base-game progress). Enough to make a cold load
 * several times faster, few enough to stay clear of Sony's rate limit.
 */
const PARALLEL = 4
/** The language trophy texts come in when none is asked for. */
const DEFAULT_LANGUAGE = 'en-US'
/** Sony's language tags for the app's languages. */
const LANGUAGES: Record<string, string> = {
  en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', ja: 'ja-JP', pl: 'pl-PL', pt: 'pt-PT', ru: 'ru-RU',
}

/** The Accept-Language Sony is asked in, from the app's language code. Unknown codes get English. */
export function psnLanguage(lang: string | null | undefined): string {
  return (lang && LANGUAGES[lang]) || DEFAULT_LANGUAGE
}

// The tokens in use on this instance. The database keeps them too
// (psnCredentials), so a cold start reuses them instead of spending the NPSSO.
let tokens: PsnTokens | null = null
let pending: Promise<PsnTokens> | null = null

/** Where the NPSSO comes from: the one an admin pasted, else the PSN_NPSSO variable (the first setup). */
async function storedCredentials(): Promise<PsnCredentials | null> {
  try {
    return await loadPsnCredentials()
  } catch (err) {
    // A missing table (migration not run) or a database hiccup: fall back to the variable.
    console.error('[psn] stored credentials unavailable', err)
    return null
  }
}

/** Whether PSN can be called at all: an NPSSO is stored or set in the environment. */
export async function psnConfigured(): Promise<boolean> {
  if (process.env.PSN_NPSSO?.trim()) return true
  return Boolean((await storedCredentials())?.npsso)
}

function unwrap<T>(res: T): T {
  const error = (res as { error?: { message?: string; code?: number } } | null)?.error
  if (error) throw new PsnError(error.message ?? 'PSN error', error.code)
  return res
}

let cooldownUntil = 0

/** One request's worth of the budget, counted under `fn`; PsnBusyError when it is spent. */
async function spend(fn: PsnFunction): Promise<void> {
  if (Date.now() < cooldownUntil || !(await takePsnCall())) throw new PsnBusyError()
  countUpstream('psn')
  recordPsnCall(fn)
}

/** One request to Sony: within the app's budget, and never longer than the deadline. */
async function attempt<T>(fn: PsnFunction, call: () => Promise<T>): Promise<T> {
  await spend(fn)
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PsnError('PSN did not answer in time')), CALL_TIMEOUT_MS)
  })
  try {
    return unwrap(await Promise.race([call(), deadline]))
  } finally {
    clearTimeout(timer)
  }
}

/**
 * One Sony call, unwrapped and counted under `fn` (psnCallStats). When Sony says "too many requests" it waits a
 * moment and asks once more; a second refusal is thrown (psnFailure answers
 * 429) and this instance stops asking for a minute: one account serves everyone,
 * so insisting is what would take PSN away from all of them. Any other error is
 * thrown at once: retrying a hidden profile helps no one.
 */
export async function psnCall<T>(fn: PsnFunction, call: () => Promise<T>): Promise<T> {
  try {
    return await attempt(fn, call)
  } catch (err) {
    if (!(err instanceof PsnError && err.isRateLimited) || err instanceof PsnBusyError) throw err
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WAIT_MS))
    try {
      return await attempt(fn, call)
    } catch (again) {
      if (again instanceof PsnError && again.isRateLimited && !(again instanceof PsnBusyError)) {
        cooldownUntil = Date.now() + COOLDOWN_MS
        await psnRateLimited()
      }
      throw again
    }
  }
}

function toTokens(res: AuthTokensResponse): PsnTokens {
  if (!res.accessToken) throw new PsnError('PSN refused the token exchange')
  const now = Date.now()
  return {
    accessToken: res.accessToken,
    accessExpiresAt: now + res.expiresIn * 1000,
    refreshToken: res.refreshToken,
    refreshExpiresAt: now + res.refreshTokenExpiresIn * 1000,
  }
}

/**
 * Fresh tokens, cheapest first: the stored access token, then the refresh
 * token, then a new exchange of the NPSSO. What comes out is stored for the
 * next instance. An NPSSO from the environment is copied in on first use
 * (with its expiry, asked of Sony), so the admin panel and the reminder
 * know when it dies.
 */
async function newTokens(): Promise<PsnTokens> {
  const now = Date.now()
  const stored = await storedCredentials()
  const known = stored?.tokens ?? tokens
  if (known && known.accessExpiresAt - MARGIN_MS > now) return known

  if (known && known.refreshExpiresAt - MARGIN_MS > now) {
    try {
      await spend('auth')
      const refreshed = toTokens(await exchangeRefreshTokenForAuthTokens(known.refreshToken))
      // Sony hands back the same refresh token with the same deadline; keep that deadline.
      refreshed.refreshExpiresAt = Math.min(refreshed.refreshExpiresAt, known.refreshExpiresAt)
      await savePsnTokens(refreshed).catch((err) => console.error('[psn] could not store tokens', err))
      return refreshed
    } catch (err) {
      console.error('[psn] refresh failed, falling back to NPSSO', err)
    }
  }

  const envNpsso = process.env.PSN_NPSSO?.trim() || null
  const npsso = stored?.npsso ?? envNpsso
  if (!npsso) throw new PsnError('PSN is not configured: no NPSSO stored or set', NOT_CONFIGURED)
  if (!stored?.npsso && envNpsso) {
    await savePsnNpsso(envNpsso, await npssoExpiry(envNpsso), 'PSN_NPSSO').catch((err) =>
      console.error('[psn] could not store the NPSSO', err),
    )
  }
  const fresh = await exchangeNpsso(npsso)
  await savePsnTokens(fresh).catch((err) => console.error('[psn] could not store tokens', err))
  return fresh
}

/** The two requests that turn an NPSSO into tokens. */
async function exchangeNpsso(npsso: string): Promise<PsnTokens> {
  await spend('auth')
  const code = await exchangeNpssoForAccessCode(npsso)
  await spend('auth')
  return toTokens(await exchangeAccessCodeForAuthTokens(code))
}

async function authorization(): Promise<AuthorizationPayload> {
  if (tokens && Date.now() < tokens.accessExpiresAt - MARGIN_MS) return { accessToken: tokens.accessToken }
  pending ??= newTokens()
    .then((t) => (tokens = t))
    .finally(() => {
      pending = null
    })
  return { accessToken: (await pending).accessToken }
}

/** Drops this instance's tokens, so the next call starts from what is stored (a new NPSSO). */
export function forgetPsnTokens(): void {
  cooldownUntil = 0
  tokens = null
}

/** Exchanges an NPSSO once, to prove it works before it is stored. */
export async function verifyNpsso(npsso: string): Promise<PsnTokens> {
  return exchangeNpsso(npsso)
}

/** Sony's icons come as http:// at times, which the site's CSP (and any https page) refuses. */
function https(url: string): string {
  return url.replace(/^http:\/\//, 'https://')
}

/** The account with exactly this online ID (any case), or null. */
export async function findPsnAccount(username: string): Promise<{ accountId: string; onlineId: string } | null> {
  const wanted = username.toLowerCase()
  // An online ID nobody has is remembered for an hour (#177): typing it again does not ask Sony again.
  const notFound = `psn:notfound:${wanted}`
  if (await readCache<boolean>(notFound)) return null
  const res = await psnCall('search', async () => makeUniversalSearch(await authorization(), username, 'SocialAllAccounts'))
  const match = res.domainResponses?.[0]?.results?.find((r) => r.socialMetadata.onlineId.toLowerCase() === wanted)
  if (!match) await writeCache(notFound, true, NOT_FOUND_TTL_MS)
  return match ? { accountId: match.socialMetadata.accountId, onlineId: match.socialMetadata.onlineId } : null
}

/** The largest avatar, over https (the same host serves both). */
export function avatarUrl(avatars: Array<{ size: string; url: string }>): string | null {
  const best = ['xl', 'l', 'm', 's'].map((size) => avatars.find((a) => a.size === size)).find(Boolean)
  return best ? https(best.url) : null
}

export type PsnSummary = {
  onlineId: string
  avatarUrl: string | null
  aboutMe: string
  isPlus: boolean
  trophyLevel: number
  /** 1–10: bronze 1–3, silver 4–6, gold 7–9, platinum 10. */
  tier: number
  /** 0–100, toward the next level. */
  levelProgress: number
  earned: TrophyCounts
  games: number
  /** When the library was last read from Sony (ms), and when the refresh button may read it again: the summary route adds them. */
  syncedAt?: number | null
  nextSyncAt?: number | null
}

/**
 * The headline numbers for one account. The games are the core library's (shared with it, so no request of its
 * own). Throws a PsnError with isPrivate when its trophies are hidden.
 */
export async function psnSummary(accountId: string, userId: string | null = null): Promise<PsnSummary> {
  return psnCached(
    `psn:summary:v4:${accountId}`,
    SUMMARY_TTL_MS,
    async () => {
      const auth = await authorization()
      const [summary, profile, games] = await Promise.all([
        psnCall('summary', () => getUserTrophyProfileSummary(auth, accountId)),
        psnCall('profile', () => getProfileFromAccountId(auth, accountId)),
        psnTitlesCore(accountId, userId),
      ])
      return {
        onlineId: profile.onlineId,
        avatarUrl: avatarUrl(profile.avatars ?? []),
        aboutMe: profile.aboutMe ?? '',
        isPlus: profile.isPlus === true,
        trophyLevel: Number(summary.trophyLevel) || 0,
        tier: summary.tier ?? 1,
        levelProgress: summary.progress ?? 0,
        earned: summary.earnedTrophies,
        games: games.length,
      }
    },
    { accountId, userId },
  )
}

/**
 * The text of an account's About Me, read now and never cached: verification (#176) asks once, when the user
 * presses "check", and the answer must be what the profile says this second. Throws as any call does.
 */
export async function psnAboutMe(accountId: string): Promise<string> {
  const auth = await authorization()
  const profile = await psnCall('profile', () => getProfileFromAccountId(auth, accountId))
  return profile.aboutMe ?? ''
}

/** One of Sony's trophy titles in the unified game model. Null for an ID that is not NPWR (never seen, but not trusted). */
export function toPsnGameProgress(t: TrophyTitle): PsnGameProgress | null {
  const id = psnNumericId(t.npCommunicationId)
  if (id === null) return null
  return {
    _source: 'psn',
    id,
    titleId: t.npCommunicationId,
    service: t.npServiceName,
    title: t.trophyTitleName,
    imageIcon: https(t.trophyTitleIconUrl),
    consoleName: psnPlatformName(t.trophyTitlePlatform),
    maxPossible: countTrophies(t.definedTrophies),
    numAwarded: countTrophies(t.earnedTrophies),
    pctWon: t.progress,
    lastPlayed: t.lastUpdatedDateTime ?? null,
    earned: t.earnedTrophies,
    defined: t.definedTrophies,
    hasDlc: t.hasTrophyGroups === true,
    lastTrophyAt: t.lastUpdatedDateTime ?? null,
    playtimeMinutes: null,
    playedAs: [],
    playCount: null,
    coverUrl: null,
    heroUrl: null,
    conceptId: null,
    collection: null,
  }
}

/** "PT43H19M14S" (ISO 8601, as Sony writes play time) in whole minutes; null when unreadable. */
export function durationMinutes(iso: string | undefined): number | null {
  const m = iso ? /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?$/.exec(iso) : null
  if (!m) return null
  const [, d, h, min] = m
  return Number(d ?? 0) * 1440 + Number(h ?? 0) * 60 + Number(min ?? 0)
}

/** One game the account has played, as Sony's game list reports it (PS4/PS5 only). */
type PlayedGame = {
  /** The game's own id ("CUSA01106_00"), not its trophy set's. */
  titleId: string
  name: string
  lastPlayed: string | null
  playtimeMinutes: number | null
  playCount: number
  /** Sony's square store icon. The trophy set's icon is a 320×176 banner on PS4/PS3, cropped when shown square. */
  iconUrl: string | null
  coverUrl: string | null
  heroUrl: string | null
  conceptId: number | null
}

// Only a portrait counts as a cover: most PS4 games have none, and their 16:9 hub art cropped to 2:3 was unreadable.
const COVER_TYPES = ['PORTRAIT_BANNER']
const HERO_TYPES = ['BACKGROUND_LAYER_ART', 'SIXTEEN_BY_NINE_BANNER', 'FOUR_BY_THREE_BANNER', 'GAMEHUB_COVER_ART']

function pickImage(images: Array<{ url: string; type: string }>, types: string[]): string | null {
  const found = types.map((type) => images.find((i) => i.type === type)).find(Boolean)
  return found ? https(found.url) : null
}

/** Every game the account has played, with when, for how long and its store art. */
async function playedGames(accountId: string): Promise<PlayedGame[]> {
  const auth = await authorization()
  const games: PlayedGame[] = []
  for (let offset = 0; ; offset += PLAYED_PAGE) {
    const page = await psnCall('played', () => getUserPlayedGames(auth, accountId, { limit: PLAYED_PAGE, offset }))
    const titles = page.titles ?? []
    for (const t of titles) {
      const images = t.concept?.media?.images ?? []
      games.push({
        titleId: t.titleId,
        name: t.localizedName || t.name,
        lastPlayed: t.lastPlayedDateTime ?? null,
        playtimeMinutes: durationMinutes(t.playDuration),
        playCount: t.playCount ?? 0,
        iconUrl: t.imageUrl ? https(t.imageUrl) : pickImage(images, ['MASTER']),
        coverUrl: pickImage(images, COVER_TYPES),
        heroUrl: pickImage(images, HERO_TYPES),
        conceptId: t.concept?.id ?? null,
      })
    }
    if (!page.nextOffset || titles.length === 0) break
  }
  return games
}

/**
 * Which trophy sets each played game has: "CUSA01106_00" → ["NPWR07410_00"].
 * A collection can have several, a game with no trophies none. Sony answers
 * five ids at a time, and the answer never changes, so each is kept long
 * (and shared: a game's sets are the same for every player).
 */
async function trophySetsOf(accountId: string, titleIds: string[], userId: string | null, limit = Infinity): Promise<Map<string, string[]>> {
  const key = (id: string) => `psn:sets:${id}`
  const cached = await readCacheMany<string[]>(titleIds.map(key))
  const found = new Map(titleIds.filter((id) => cached.has(key(id))).map((id) => [id, cached.get(key(id))!]))
  // The first `limit` not known yet, in the order given (most recent first): a background pass is bounded.
  const missing = titleIds.filter((id) => !found.has(id)).slice(0, limit)
  if (missing.length === 0) return found

  const auth = await authorization()
  const batches: string[][] = []
  for (let i = 0; i < missing.length; i += LOOKUP_BATCH) batches.push(missing.slice(i, i + LOOKUP_BATCH))
  const answers = await mapLimit(batches, PARALLEL, async (batch) => {
    const res = await psnCall('sets', () => getUserTrophiesForSpecificTitle(auth, accountId, { npTitleIds: batch.join(',') }))
    const answered = new Map((res.titles ?? []).map((t) => [t.npTitleId, (t.trophyTitles ?? []).map((tt) => tt.npCommunicationId)]))
    for (const id of batch) {
      const sets = answered.get(id) ?? []
      found.set(id, sets)
      await writeCache(key(id), sets, LOOKUP_TTL_MS)
    }
  })
  // A batch Sony refused leaves its games without play data this time; the rest still count.
  for (const a of answers) if (a.status === 'rejected') console.error('[psn] trophy-set lookup', a.reason)
  return found
}

/**
 * Puts what the played-games list knows onto the trophy list: last session,
 * play time, times played and the store art. Several games can share a
 * trophy set (a PS4 and a PS5 version): their time adds up, the latest
 * session and its art win. A collection is one entry for several sets and
 * Sony does not say which game was played, so its session goes only to the
 * set with the newest trophy (its other games keep their own trophy date).
 */
export function withPlayData(games: PsnGameProgress[], played: PlayedGame[], sets: Map<string, string[]>): PsnGameProgress[] {
  const bySet = new Map<string, PlayedGame[]>()
  for (const p of played) {
    for (const set of sets.get(p.titleId) ?? []) bySet.set(set, [...(bySet.get(set) ?? []), p])
  }
  const lastTrophy = new Map(games.map((g) => [g.titleId, g.lastTrophyAt ?? '']))
  const playing = (p: PlayedGame) =>
    [...(sets.get(p.titleId) ?? [])].sort((a, b) => (lastTrophy.get(b) ?? '').localeCompare(lastTrophy.get(a) ?? ''))[0]
  return games
    .map((g) => {
      const plays = bySet.get(g.titleId)
      if (!plays) return g
      const latest = [...plays].sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''))[0]
      const session = plays.filter((p) => playing(p) === g.titleId).map((p) => p.lastPlayed ?? '').sort().at(-1) || null
      const coll = plays
        .filter((p) => (sets.get(p.titleId)?.length ?? 0) > 1)
        .sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''))[0]
      // A collection's icon is the collection's, so its games keep their own trophy icon.
      const icon = [latest, ...plays].find((p) => p.iconUrl && sets.get(p.titleId)?.length === 1)?.iconUrl
      const minutes = plays.some((p) => p.playtimeMinutes !== null)
        ? plays.reduce((sum, p) => sum + (p.playtimeMinutes ?? 0), 0)
        : null
      return {
        ...g,
        imageIcon: icon ?? g.imageIcon,
        lastPlayed: session && (!g.lastTrophyAt || session > g.lastTrophyAt) ? session : g.lastTrophyAt,
        playtimeMinutes: minutes,
        playedAs: plays.map((p) => p.titleId).sort(),
        playCount: plays.reduce((sum, p) => sum + p.playCount, 0),
        coverUrl: plays.map((p) => p.coverUrl).find(Boolean) ?? null,
        heroUrl: plays.map((p) => p.heroUrl).find(Boolean) ?? null,
        conceptId: latest.conceptId,
        collection: coll
          ? { titleId: coll.titleId, title: coll.name, iconUrl: coll.iconUrl, heroUrl: coll.heroUrl, lastPlayed: coll.lastPlayed, playtimeMinutes: coll.playtimeMinutes }
          : null,
      }
    })
    .sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''))
}

type GameRef = Pick<PsnGameProgress, 'titleId' | 'service' | 'lastTrophyAt'>
type GroupDef = Pick<PsnTrophyGroup, 'id' | 'name' | 'iconUrl' | 'defined'>
type GroupEarned = { id: string; earned: TrophyCounts; progress: number }
type TrophyDef = Pick<PsnTrophy, 'id' | 'name' | 'detail' | 'iconUrl' | 'type' | 'groupId' | 'hidden'>
type TrophyEarned = Pick<PsnTrophy, 'id' | 'earned' | 'earnedAt' | 'rarity'>

/**
 * What every player of a game shares (its defined trophies or groups, in `language`) and what is the account's
 * (keyed by the game's last trophy, in no language), read apart so the shared half is paid once for everyone
 * (#177). A DLC added after the shared half was kept shows as an id it lacks: then it is read again.
 */
async function splitRead<D extends { id: unknown }, E extends { id: unknown }>(
  keys: { defined: string; earned: string },
  userId: string | null,
  defined: () => Promise<D[]>,
  earned: () => Promise<E[]>,
): Promise<{ defined: D[]; earned: E[] }> {
  const [defs, mine] = await Promise.all([
    withSteamCache(keys.defined, DEFINED_TTL_MS, defined),
    withSteamCache(keys.earned, SETTLED_TROPHIES_TTL_MS, earned, { userId }),
  ])
  const known = new Set(defs.map((d) => d.id))
  if (mine.every((e) => known.has(e.id))) return { defined: defs, earned: mine }
  const fresh = await defined()
  await writeCache(keys.defined, fresh, DEFINED_TTL_MS)
  return { defined: fresh, earned: mine }
}

/**
 * A game's trophy groups — the base game ("default") and each DLC — with
 * their names in `language`, what each holds and what the account has
 * earned of it.
 */
export async function psnGameGroups(accountId: string, game: GameRef, userId: string | null = null, language = DEFAULT_LANGUAGE): Promise<PsnTrophyGroup[]> {
  const options = { npServiceName: game.service }
  const { defined, earned } = await splitRead<GroupDef, GroupEarned>(
    {
      defined: `psn:groupdefs:v1:${game.titleId}:${language}`,
      earned: `psn:groupearned:v1:${accountId}:${game.titleId}:${game.lastTrophyAt ?? ''}`,
    },
    userId,
    async () => {
      const res = await psnCall('gameGroups', async () => getTitleTrophyGroups(await authorization(), game.titleId, { ...options, headerOverrides: { 'Accept-Language': language } }))
      return (res.trophyGroups ?? []).map((g) => ({ id: g.trophyGroupId, name: g.trophyGroupName, iconUrl: g.trophyGroupIconUrl ? https(g.trophyGroupIconUrl) : null, defined: g.definedTrophies }))
    },
    async () => {
      const res = await psnCall('gameGroups', async () => getUserTrophyGroupEarningsForTitle(await authorization(), accountId, game.titleId, options))
      return (res.trophyGroups ?? []).map((g) => ({ id: g.trophyGroupId, earned: g.earnedTrophies, progress: g.progress }))
    },
  )
  const none: TrophyCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
  const earnedById = new Map(earned.map((g) => [g.id, g]))
  return defined.map((g) => ({ ...g, earned: earnedById.get(g.id)?.earned ?? none, progress: earnedById.get(g.id)?.progress ?? 0 }))
}

/**
 * The core of the library (#177): every game in the trophy list, from Sony's title list alone (one request per
 * 800 games), most recent trophy first. No play data, store art or completion dates: that is `psnLibrary`.
 */
export async function psnTitlesCore(accountId: string, userId: string | null = null): Promise<PsnGameProgress[]> {
  return psnCached(
    titlesKey(accountId),
    TITLES_TTL_MS,
    async () => {
      const auth = await authorization()
      const games: PsnGameProgress[] = []
      for (let offset = 0; ; offset += TITLES_PAGE) {
        const page = await psnCall('titles', () => getUserTitles(auth, accountId, { limit: TITLES_PAGE, offset }))
        const titles = page.trophyTitles ?? []
        for (const t of titles) {
          const game = toPsnGameProgress(t)
          if (game) games.push(game)
        }
        if (!page.nextOffset || titles.length === 0) break
      }
      return games.sort((a, b) => (b.lastTrophyAt ?? '').localeCompare(a.lastTrophyAt ?? ''))
    },
    { accountId, userId },
  )
}

const titlesKey = (accountId: string) => `psn:titles:core:v1:${accountId}`

/** When the account's library was last read from Sony (ms), for "last synced"; null before the first read. */
export function psnLibrarySyncedAt(accountId: string): Promise<number | null> {
  return psnSyncedAt(titlesKey(accountId))
}

/** What the background adds to the core: the played-games list, the trophy sets looked up so far, IGDB art and completion dates. */
type Enrichment = {
  played: PlayedGame[]
  sets: Record<string, string[]>
  art: Record<string, IgdbArt>
  /** A DLC game's base-game completion date, by `titleId@lastTrophyAt` (it can only change when that does). */
  completed: Record<string, string | null>
}

const completionKey = (g: Pick<PsnGameProgress, 'titleId' | 'lastTrophyAt'>) => `${g.titleId}@${g.lastTrophyAt ?? ''}`

/**
 * Every game in the account's trophy list, most recently played first: the core, with what the background has
 * enriched so far laid over it. A page never waits for the enrichment: the first visit gets the core, and the
 * play time, art and completion dates arrive on a later read, 20 games a pass. A game's trophies are the whole
 * set, DLC included.
 */
export async function psnLibrary(accountId: string, userId: string | null = null): Promise<PsnGameProgress[]> {
  const core = await psnTitlesCore(accountId, userId)
  let enrichment: Enrichment | null = null
  try {
    enrichment = await psnCached(`psn:enriched:v1:${accountId}`, ENRICHED_TTL_MS, () => enrich(accountId, userId), { accountId, userId, cold: 'background' })
  } catch (err) {
    if (!(err instanceof PsnSyncing)) console.error('[psn] enrichment unavailable, core only', err)
  }
  return withEnrichment(core, enrichment)
}

/** The core with the enrichment laid over it (both may come from different moments: the core wins on trophies). */
export function withEnrichment(core: PsnGameProgress[], enrichment: Enrichment | null): PsnGameProgress[] {
  if (!enrichment) return withCompletion(core, () => null)
  const played = withPlayData(core, enrichment.played, new Map(Object.entries(enrichment.sets)))
  const art = played.map((g) => {
    const a = enrichment.art[g.titleId]
    return a && !g.coverUrl ? { ...g, coverUrl: a.coverUrl ?? g.coverUrl, heroUrl: a.heroUrl ?? g.heroUrl } : g
  })
  return withCompletion(art, (g) => enrichment.completed[completionKey(g)] ?? null)
}

/** One background pass: the whole played list, trophy sets for up to ENRICH_GAMES more games, art, and completion dates for up to ENRICH_GAMES more. */
async function enrich(accountId: string, userId: string | null): Promise<Enrichment> {
  const core = await psnTitlesCore(accountId, userId)
  const before = (await readCache<Enrichment>(`psn:enriched:v1:${accountId}`)) ?? null
  let played: PlayedGame[] = []
  try {
    played = await playedGames(accountId)
  } catch (err) {
    // The played-games list is its own privacy setting: hidden, the trophies still show, without play data.
    if (!(err instanceof PsnError && err.isPrivate)) throw err
  }
  const recentFirst = [...played].sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '')).map((p) => p.titleId)
  const sets = await trophySetsOf(accountId, recentFirst, userId, ENRICH_GAMES)
  return {
    played,
    sets: Object.fromEntries(sets),
    art: await igdbArtFor(withPlayData(core, played, sets)),
    completed: await completionDates(accountId, core, before?.completed ?? {}, userId),
  }
}

/** Base-game completion dates of DLC games, kept from the last pass while the game has not moved, up to ENRICH_GAMES more read. */
async function completionDates(accountId: string, core: PsnGameProgress[], known: Record<string, string | null>, userId: string | null) {
  const eligible = core.filter(needsBaseTrophies)
  const kept = Object.fromEntries(eligible.filter((g) => completionKey(g) in known).map((g) => [completionKey(g), known[completionKey(g)]]))
  const todo = eligible.filter((g) => !(completionKey(g) in kept)).slice(0, ENRICH_GAMES)
  const results = await mapLimit(todo, 2, async (g) => psnBaseCompletedAt(await psnGameTrophies(accountId, g, userId)))
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') kept[completionKey(todo[i])] = r.value
    else if (!(r.reason instanceof PsnBusyError)) console.error('[psn] completion date unavailable', todo[i].titleId, r.reason)
  })
  return kept
}

/**
 * PS3/Vita games' cover and backdrop from IGDB: Sony keeps none for them (no
 * played-games entry, no Store page). Each is cached half a year, so only a
 * new PS3/Vita game costs a call; one that fails stays as it was.
 */
async function igdbArtFor(games: PsnGameProgress[]): Promise<Record<string, IgdbArt>> {
  const old = games.filter((g) => !g.coverUrl && igdbPlatforms(g.consoleName).length > 0)
  if (old.length === 0 || !igdbConfigured()) return {}
  // ponytail: IGDB allows 4 requests a second; PARALLEL in flight stays under it in practice. A queue if it ever 429s.
  const results = await mapLimit(old, PARALLEL, (g) => igdbArt(g.title, g.consoleName))
  const art: Record<string, IgdbArt> = {}
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error('[psn] IGDB art', old[i].titleId, r.reason)
    else if (r.value) art[old[i].titleId] = r.value
  })
  return art
}

/**
 * A game's whole trophy set (base game and DLC, each trophy with its group),
 * merged with what the account has earned, its texts in `language`.
 */
export async function psnGameTrophies(accountId: string, game: GameRef, userId: string | null = null, language = DEFAULT_LANGUAGE): Promise<PsnTrophy[]> {
  const options = { npServiceName: game.service }
  const { defined, earned } = await splitRead<TrophyDef, TrophyEarned>(
    {
      defined: `psn:defs:v1:${game.titleId}:${language}`,
      earned: `psn:earned:v1:${accountId}:${game.titleId}:${game.lastTrophyAt ?? ''}`,
    },
    userId,
    async () => {
      const res = await psnCall('gameTrophies', async () => getTitleTrophies(await authorization(), game.titleId, 'all', { ...options, headerOverrides: { 'Accept-Language': language } }))
      return (res.trophies ?? []).map((t) => ({
        id: t.trophyId,
        name: t.trophyName ?? '',
        detail: t.trophyDetail ?? '',
        iconUrl: t.trophyIconUrl ? https(t.trophyIconUrl) : null,
        type: t.trophyType,
        groupId: t.trophyGroupId ?? 'default',
        hidden: t.trophyHidden,
      }))
    },
    async () => {
      const res = await psnCall('gameTrophies', async () => getUserTrophiesEarnedForTitle(await authorization(), accountId, game.titleId, 'all', options))
      return (res.trophies ?? []).map((t) => {
        const rate = Number(t.trophyEarnedRate)
        return { id: t.trophyId, earned: t.earned === true, earnedAt: t.earnedDateTime ?? null, rarity: t.trophyEarnedRate && Number.isFinite(rate) ? rate : null }
      })
    },
  )
  const earnedById = new Map(earned.map((t) => [t.id, t]))
  return defined.map((t) => ({ ...t, earned: false, earnedAt: null, rarity: null, ...earnedById.get(t.id) }))
}

/** A game of the account's by Sony's ID, or null when it is not in their list. */
export async function findPsnGame(accountId: string, titleId: string, userId: string | null = null): Promise<PsnGameProgress | null> {
  return (await psnTitlesCore(accountId, userId)).find((g) => g.titleId === titleId) ?? null
}

function toRecentTrophy(game: PsnGameProgress, t: PsnTrophy & { earnedAt: string }): PsnRecentTrophy {
  return {
    gameId: game.id,
    titleId: game.titleId,
    gameTitle: game.title,
    gameIconUrl: game.imageIcon,
    trophyId: t.id,
    name: t.name,
    iconUrl: t.iconUrl,
    type: t.type,
    earnedAt: t.earnedAt,
    rarity: t.rarity,
  }
}

/** How many of the latest games the profile column's "recent trophies" look through. */
const LATEST_GAMES = 3

/**
 * The latest trophies, however long ago they were earned — from the last few
 * games played, for the profile column. Newest first. What a first visit reads
 * of trophies (#177): 2 requests per game, the year waits for the background.
 */
export async function psnLatestTrophies(accountId: string, userId: string | null = null, language = DEFAULT_LANGUAGE): Promise<PsnRecentTrophy[]> {
  const games = (await psnTitlesCore(accountId, userId)).filter((g) => countTrophies(g.earned) > 0).slice(0, LATEST_GAMES)
  return earnedSince(accountId, games, '', userId, language)
}

/**
 * Trophies earned on or after `since` (ISO; '' for all) across `games`, newest first, a few games at a time.
 * One game failing leaves it out; the budget running out stops the rest and fails the whole, so a part is never
 * kept as if it were all of it.
 */
async function earnedSince(accountId: string, games: PsnGameProgress[], since: string, userId: string | null, language: string): Promise<PsnRecentTrophy[]> {
  let busy: unknown = null
  const lists = await mapLimit(games, PARALLEL, async (game) => {
    if (busy) throw busy
    return psnGameTrophies(accountId, game, userId, language).catch((err: unknown) => {
      if (err instanceof PsnBusyError) busy = err
      throw err
    })
  })
  if (busy) throw busy
  const unlocks: PsnRecentTrophy[] = []
  lists.forEach((list, i) => {
    if (list.status === 'rejected') return console.error('[psn] trophies for the feed', games[i].titleId, list.reason)
    for (const t of list.value) {
      if (t.earned && t.earnedAt && t.earnedAt >= since) unlocks.push(toRecentTrophy(games[i], { ...t, earnedAt: t.earnedAt }))
    }
  })
  // Nothing at all came back: that is a failure, not an empty feed.
  if (games.length > 0 && lists.every((l) => l.status === 'rejected')) throw (lists[0] as PromiseRejectedResult).reason
  return unlocks.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))
}

/**
 * Every trophy earned in the last `days` days (at most a year), newest first. Sony has no feed for this, so the
 * year is built from the games whose last trophy falls in it, 2 requests per game: too many for a first visit,
 * so it is built in the background (#177) and this throws PsnSyncing (202) until it is there. Kept YEAR_TTL_MS
 * and served stale after; a rebuild reads only the games that moved, since each game's entry is keyed by its
 * last trophy.
 */
export async function psnRecentTrophies(accountId: string, days: number, userId: string | null = null, language = DEFAULT_LANGUAGE): Promise<PsnRecentTrophy[]> {
  const year = await psnCached(
    `psn:year:v1:${accountId}:${language}`,
    YEAR_TTL_MS,
    async () => {
      const since = new Date(Date.now() - YEAR_DAYS * DAY_MS).toISOString()
      const games = (await psnTitlesCore(accountId, userId)).filter((g) => g.lastTrophyAt && g.lastTrophyAt >= since)
      return earnedSince(accountId, games, since, userId, language)
    },
    { accountId, userId, cold: 'background' },
  )
  const since = new Date(Date.now() - Math.min(days, YEAR_DAYS) * DAY_MS).toISOString()
  return year.filter((t) => t.earnedAt >= since)
}

/** A store page's release date does not change; kept half a year. */
const RELEASE_TTL_MS = 180 * 24 * 60 * 60 * 1000
const STORE_CONCEPT_URL = 'https://store.playstation.com/en-us/concept/'

/**
 * The year a game came out, read from its PlayStation Store page (Sony's
 * trophy data has no release date). Null when the page has none or cannot be
 * read; cached for everyone, since it is the same for every player.
 */
export async function psnReleaseYear(conceptId: number): Promise<number | null> {
  return withSteamCache<number | null>(
    `psn:release:${conceptId}`,
    RELEASE_TTL_MS,
    async () => {
      const res = await fetch(`${STORE_CONCEPT_URL}${conceptId}`, { headers: { 'Accept-Language': 'en-US' }, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) })
      if (!res.ok) throw new PsnError(`PlayStation Store answered ${res.status}`)
      const m = /"releaseDate":"(\d{4})-\d{2}-\d{2}T/.exec(await res.text())
      return m ? Number(m[1]) : null
    },
    { shouldCache: (year) => year !== null },
  )
}

/** How long the client waits before asking again for something being built in the background. */
const SYNC_RETRY_S = 15

/** The response for a PSN call that threw: 202 while it is built in the background, 429 `busy` when the app's budget is spent, 503 with no sign-in set up, 403 for a hidden profile, 429 when Sony is rate-limiting us, 502 for anything else. */
export function psnFailure(err: unknown, where: string): NextResponse {
  if (err instanceof PsnSyncing) {
    return NextResponse.json({ status: 'syncing' }, { status: 202, headers: { 'Retry-After': String(SYNC_RETRY_S) } })
  }
  if (err instanceof PsnBusyError) {
    return NextResponse.json({ error: 'busy' }, { status: 429, headers: { 'Retry-After': '60' } })
  }
  if (err instanceof PsnError && err.notConfigured) {
    return NextResponse.json({ error: 'not-configured' }, { status: 503 })
  }
  if (err instanceof PsnError && err.isPrivate) {
    return NextResponse.json({ error: 'private' }, { status: 403 })
  }
  if (err instanceof PsnError && err.isRateLimited) {
    // The client reads any unknown code as a plain failure with a retry button.
    return NextResponse.json({ error: 'rate-limited' }, { status: 429, headers: { 'Retry-After': '60' } })
  }
  console.error(`[${where}]`, err)
  return NextResponse.json({ error: 'failed' }, { status: 502 })
}
