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
import { readCacheMany, withSteamCache, writeCache } from '@/lib/steamCache'
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

/**
 * PlayStation Network through psn-api, which speaks Sony's own (unofficial)
 * mobile API. Every call is authenticated as ONE account: the one whose NPSSO
 * token is in PSN_NPSSO — like Steam's server-wide key, not per user. That
 * account can read any profile whose trophies are public. Its NPSSO and
 * tokens live in the database (see psnCredentials), seeded once from
 * PSN_NPSSO and renewed from the admin panel.
 *
 * psn-api returns Sony's error bodies instead of throwing, so every response
 * goes through unwrap(). Responses are cached in the Steam cache table, under
 * keys starting "psn:".
 */

/** Sony's code for "this profile hides its trophies". */
const PRIVATE_CODE = 2240526
const MARGIN_MS = 60_000
const SUMMARY_TTL_MS = 15 * 60 * 1000
const TITLES_TTL_MS = 15 * 60 * 1000
/**
 * A game's trophies are keyed by when its last trophy was earned: they can
 * only change when that does, which changes the key. So an entry for a game
 * not touched since is still right a month later — the same idea as Steam's
 * settledProgress.
 */
const SETTLED_TROPHIES_TTL_MS = 30 * 24 * 60 * 60 * 1000
/** The most titles Sony returns per page. */
const TITLES_PAGE = 800
/** The most played games Sony returns per page. */
const PLAYED_PAGE = 200
/** Sony refuses more than five ids per trophy-set lookup. */
const LOOKUP_BATCH = 5
/** A game's trophy sets never change, so the lookup is kept a long time. */
const LOOKUP_TTL_MS = 90 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
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

/** The code a PsnError carries when the app has no PSN sign-in at all. */
const NOT_CONFIGURED = -1

export class PsnError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message)
  }
  get notConfigured() {
    return this.code === NOT_CONFIGURED
  }
  get isPrivate() {
    return this.code === PRIVATE_CODE || /access control|privacy/i.test(this.message)
  }
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
  const fresh = toTokens(await exchangeAccessCodeForAuthTokens(await exchangeNpssoForAccessCode(npsso)))
  await savePsnTokens(fresh).catch((err) => console.error('[psn] could not store tokens', err))
  return fresh
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
  tokens = null
}

/** Exchanges an NPSSO once, to prove it works before it is stored. */
export async function verifyNpsso(npsso: string): Promise<PsnTokens> {
  return toTokens(await exchangeAccessCodeForAuthTokens(await exchangeNpssoForAccessCode(npsso)))
}

/** Sony's icons come as http:// at times, which the site's CSP (and any https page) refuses. */
function https(url: string): string {
  return url.replace(/^http:\/\//, 'https://')
}

/** The account with exactly this online ID (any case), or null. */
export async function findPsnAccount(username: string): Promise<{ accountId: string; onlineId: string } | null> {
  const res = unwrap(await makeUniversalSearch(await authorization(), username, 'SocialAllAccounts'))
  const wanted = username.toLowerCase()
  const match = res.domainResponses?.[0]?.results?.find((r) => r.socialMetadata.onlineId.toLowerCase() === wanted)
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
}

/** The headline numbers for one account. Throws a PsnError with isPrivate when its trophies are hidden. */
export async function psnSummary(accountId: string, userId: string | null = null): Promise<PsnSummary> {
  return withSteamCache(
    `psn:summary:v3:${accountId}`,
    SUMMARY_TTL_MS,
    async () => {
      const auth = await authorization()
      const [summary, titles, profile] = await Promise.all([
        getUserTrophyProfileSummary(auth, accountId).then(unwrap),
        getUserTitles(auth, accountId, { limit: 1 }).then(unwrap),
        getProfileFromAccountId(auth, accountId).then(unwrap),
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
        games: titles.totalItemCount ?? 0,
      }
    },
    { userId, refreshable: true },
  )
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
    full: { earned: t.earnedTrophies, defined: t.definedTrophies, pctWon: t.progress },
    lastTrophyAt: t.lastUpdatedDateTime ?? null,
    playtimeMinutes: null,
    playedAs: [],
    playCount: null,
    coverUrl: null,
    heroUrl: null,
    conceptId: null,
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
  lastPlayed: string | null
  playtimeMinutes: number | null
  playCount: number
  coverUrl: string | null
  heroUrl: string | null
  conceptId: number | null
}

const COVER_TYPES = ['PORTRAIT_BANNER', 'GAMEHUB_COVER_ART', 'MASTER']
const HERO_TYPES = ['BACKGROUND_LAYER_ART', 'SIXTEEN_BY_NINE_BANNER', 'FOUR_BY_THREE_BANNER']

function pickImage(images: Array<{ url: string; type: string }>, types: string[]): string | null {
  const found = types.map((type) => images.find((i) => i.type === type)).find(Boolean)
  return found ? https(found.url) : null
}

/** Every game the account has played, with when, for how long and its store art. */
async function playedGames(accountId: string): Promise<PlayedGame[]> {
  const auth = await authorization()
  const games: PlayedGame[] = []
  for (let offset = 0; ; offset += PLAYED_PAGE) {
    const page = await getUserPlayedGames(auth, accountId, { limit: PLAYED_PAGE, offset })
    const titles = page.titles ?? []
    for (const t of titles) {
      const images = t.concept?.media?.images ?? []
      games.push({
        titleId: t.titleId,
        lastPlayed: t.lastPlayedDateTime ?? null,
        playtimeMinutes: durationMinutes(t.playDuration),
        playCount: t.playCount ?? 0,
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
 * five ids at a time, and the answer never changes, so each is kept long.
 */
async function trophySetsOf(accountId: string, titleIds: string[], userId: string | null): Promise<Map<string, string[]>> {
  const key = (id: string) => `psn:sets:${id}`
  const cached = await readCacheMany<string[]>(titleIds.map(key))
  const found = new Map(titleIds.filter((id) => cached.has(key(id))).map((id) => [id, cached.get(key(id))!]))
  const missing = titleIds.filter((id) => !found.has(id))
  if (missing.length === 0) return found

  const auth = await authorization()
  const batches: string[][] = []
  for (let i = 0; i < missing.length; i += LOOKUP_BATCH) batches.push(missing.slice(i, i + LOOKUP_BATCH))
  const answers = await mapLimit(batches, PARALLEL, async (batch) => {
    const res = unwrap(await getUserTrophiesForSpecificTitle(auth, accountId, { npTitleIds: batch.join(',') }))
    const answered = new Map((res.titles ?? []).map((t) => [t.npTitleId, (t.trophyTitles ?? []).map((tt) => tt.npCommunicationId)]))
    for (const id of batch) {
      const sets = answered.get(id) ?? []
      found.set(id, sets)
      await writeCache(key(id), sets, LOOKUP_TTL_MS, userId)
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
 * session and its art win.
 */
export function withPlayData(games: PsnGameProgress[], played: PlayedGame[], sets: Map<string, string[]>): PsnGameProgress[] {
  const bySet = new Map<string, PlayedGame[]>()
  for (const p of played) {
    for (const set of sets.get(p.titleId) ?? []) bySet.set(set, [...(bySet.get(set) ?? []), p])
  }
  return games
    .map((g) => {
      const plays = bySet.get(g.titleId)
      if (!plays) return g
      const latest = [...plays].sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''))[0]
      const session = latest.lastPlayed
      const minutes = plays.some((p) => p.playtimeMinutes !== null)
        ? plays.reduce((sum, p) => sum + (p.playtimeMinutes ?? 0), 0)
        : null
      return {
        ...g,
        lastPlayed: session && (!g.lastTrophyAt || session > g.lastTrophyAt) ? session : g.lastTrophyAt,
        playtimeMinutes: minutes,
        playedAs: plays.map((p) => p.titleId).sort(),
        playCount: plays.reduce((sum, p) => sum + p.playCount, 0),
        coverUrl: plays.map((p) => p.coverUrl).find(Boolean) ?? null,
        heroUrl: plays.map((p) => p.heroUrl).find(Boolean) ?? null,
        conceptId: latest.conceptId,
      }
    })
    .sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? ''))
}

/**
 * A game's trophy groups — the base game ("default") and each DLC — with
 * their names in `language`, what each holds and what the account has
 * earned of it. Cached until the game's last trophy changes.
 */
export async function psnGameGroups(
  accountId: string,
  game: Pick<PsnGameProgress, 'titleId' | 'service' | 'lastTrophyAt'>,
  userId: string | null = null,
  language = DEFAULT_LANGUAGE,
): Promise<PsnTrophyGroup[]> {
  return withSteamCache(
    `psn:groups:${accountId}:${game.titleId}:${game.lastTrophyAt ?? ''}:${language}`,
    SETTLED_TROPHIES_TTL_MS,
    async () => {
      const auth = await authorization()
      const [defined, earned] = await Promise.all([
        getTitleTrophyGroups(auth, game.titleId, { npServiceName: game.service, headerOverrides: { 'Accept-Language': language } }).then(unwrap),
        getUserTrophyGroupEarningsForTitle(auth, accountId, game.titleId, { npServiceName: game.service }).then(unwrap),
      ])
      const earnedById = new Map((earned.trophyGroups ?? []).map((g) => [g.trophyGroupId, g]))
      const none: TrophyCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
      return (defined.trophyGroups ?? []).map((g): PsnTrophyGroup => {
        const mine = earnedById.get(g.trophyGroupId)
        return {
          id: g.trophyGroupId,
          name: g.trophyGroupName,
          iconUrl: g.trophyGroupIconUrl ? https(g.trophyGroupIconUrl) : null,
          defined: g.definedTrophies,
          earned: mine?.earnedTrophies ?? none,
          progress: mine?.progress ?? 0,
        }
      })
    },
    { userId },
  )
}

/**
 * For games with DLC, puts the base game's numbers in the main fields — what
 * "completed" goes by, so a game with its platinum is complete whatever its
 * DLC — and keeps the whole set in `full`. One cached lookup per such game,
 * a few at a time; a game whose lookup fails keeps the whole-set numbers.
 */
async function withBaseGameProgress(accountId: string, games: PsnGameProgress[], userId: string | null): Promise<PsnGameProgress[]> {
  const withDlc = games.filter((g) => g.hasDlc)
  const results = await mapLimit(withDlc, PARALLEL, (g) => psnGameGroups(accountId, g, userId))
  const base = new Map<string, PsnTrophyGroup>()
  results.forEach((r, i) => {
    const group = r.status === 'fulfilled' ? r.value.find((x) => x.id === 'default') : undefined
    if (group) base.set(withDlc[i].titleId, group)
    else if (r.status === 'rejected') console.error('[psn] base-game progress', withDlc[i].titleId, r.reason)
  })
  return games.map((g) => {
    const group = base.get(g.titleId)
    if (!group) return g
    return {
      ...g,
      earned: group.earned,
      defined: group.defined,
      numAwarded: countTrophies(group.earned),
      maxPossible: countTrophies(group.defined),
      pctWon: group.progress,
    }
  })
}

/**
 * Every game in an account's trophy list, most recently played first, with
 * play time and store art from its played-games list where Sony has them.
 * That list is a separate privacy setting: hidden, the trophies still show,
 * just without the play data. Games with DLC count by their base game.
 */
export async function psnTitles(accountId: string, userId: string | null = null): Promise<PsnGameProgress[]> {
  return withSteamCache(
    `psn:titles:v8:${accountId}`,
    TITLES_TTL_MS,
    async () => {
      const auth = await authorization()
      const games: PsnGameProgress[] = []
      for (let offset = 0; ; offset += TITLES_PAGE) {
        const page = unwrap(await getUserTitles(auth, accountId, { limit: TITLES_PAGE, offset }))
        const titles = page.trophyTitles ?? []
        for (const t of titles) {
          const game = toPsnGameProgress(t)
          if (game) games.push(game)
        }
        if (!page.nextOffset || titles.length === 0) break
      }

      let list = games
      try {
        const played = await playedGames(accountId)
        const sets = await trophySetsOf(accountId, played.map((p) => p.titleId), userId)
        list = withPlayData(games, played, sets)
      } catch (err) {
        console.error('[psn] played games unavailable, trophies only', err)
      }
      return withIgdbArt(await withBaseGameProgress(accountId, list, userId))
    },
    { userId, refreshable: true },
  )
}

/**
 * PS3/Vita games' cover and backdrop from IGDB: Sony keeps none for them (no
 * played-games entry, no Store page). Each is cached half a year, so only a
 * new PS3/Vita game costs a call; one that fails stays as it was.
 */
async function withIgdbArt(games: PsnGameProgress[]): Promise<PsnGameProgress[]> {
  const old = games.filter((g) => !g.coverUrl && igdbPlatforms(g.consoleName).length > 0)
  if (old.length === 0 || !igdbConfigured()) return games
  // ponytail: IGDB allows 4 requests a second; PARALLEL in flight stays under it in practice. A queue if it ever 429s.
  const results = await mapLimit(old, PARALLEL, (g) => igdbArt(g.title, g.consoleName))
  const art = new Map<number, IgdbArt>()
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error('[psn] IGDB art', old[i].titleId, r.reason)
    else if (r.value) art.set(old[i].id, r.value)
  })
  return games.map((g) => {
    const a = art.get(g.id)
    return a ? { ...g, coverUrl: a.coverUrl ?? g.coverUrl, heroUrl: a.heroUrl ?? g.heroUrl } : g
  })
}

/**
 * A game's whole trophy set (base game and DLC, each trophy with its group),
 * merged with what the account has earned, its texts in `language`. Cached
 * until the game's last trophy changes (see SETTLED_TROPHIES_TTL_MS).
 */
export async function psnGameTrophies(
  accountId: string,
  game: Pick<PsnGameProgress, 'titleId' | 'service' | 'lastTrophyAt'>,
  userId: string | null = null,
  language = DEFAULT_LANGUAGE,
): Promise<PsnTrophy[]> {
  return withSteamCache(
    `psn:trophies:v2:${accountId}:${game.titleId}:${game.lastTrophyAt ?? ''}:${language}`,
    SETTLED_TROPHIES_TTL_MS,
    async () => {
      const auth = await authorization()
      const options = { npServiceName: game.service }
      const [defined, earned] = await Promise.all([
        getTitleTrophies(auth, game.titleId, 'all', { ...options, headerOverrides: { 'Accept-Language': language } }).then(unwrap),
        getUserTrophiesEarnedForTitle(auth, accountId, game.titleId, 'all', options).then(unwrap),
      ])
      const earnedById = new Map((earned.trophies ?? []).map((t) => [t.trophyId, t]))
      return (defined.trophies ?? []).map((t): PsnTrophy => {
        const mine = earnedById.get(t.trophyId)
        const rate = Number(mine?.trophyEarnedRate)
        return {
          id: t.trophyId,
          name: t.trophyName ?? '',
          detail: t.trophyDetail ?? '',
          iconUrl: t.trophyIconUrl ? https(t.trophyIconUrl) : null,
          type: t.trophyType,
          groupId: t.trophyGroupId ?? 'default',
          hidden: t.trophyHidden,
          earned: mine?.earned === true,
          earnedAt: mine?.earnedDateTime ?? null,
          rarity: mine?.trophyEarnedRate && Number.isFinite(rate) ? rate : null,
        }
      })
    },
    { userId },
  )
}

/** A game of the account's by Sony's ID, or null when it is not in their list. */
export async function findPsnGame(
  accountId: string,
  titleId: string,
  userId: string | null = null,
): Promise<PsnGameProgress | null> {
  return (await psnTitles(accountId, userId)).find((g) => g.titleId === titleId) ?? null
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
 * games played, for the profile column. Newest first.
 */
export async function psnLatestTrophies(
  accountId: string,
  userId: string | null = null,
  language = DEFAULT_LANGUAGE,
): Promise<PsnRecentTrophy[]> {
  const games = (await psnTitles(accountId, userId))
    .filter((g) => g.full.earned && countTrophies(g.full.earned) > 0)
    .sort((a, b) => (b.lastTrophyAt ?? '').localeCompare(a.lastTrophyAt ?? ''))
    .slice(0, LATEST_GAMES)
  return earnedSince(accountId, games, '', userId, language)
}

/** Trophies earned on or after `since` (ISO; '' for all) across `games`, newest first, a few games at a time. */
async function earnedSince(
  accountId: string,
  games: PsnGameProgress[],
  since: string,
  userId: string | null,
  language: string,
): Promise<PsnRecentTrophy[]> {
  const lists = await mapLimit(games, PARALLEL, (game) => psnGameTrophies(accountId, game, userId, language))
  const unlocks: PsnRecentTrophy[] = []
  lists.forEach((list, i) => {
    // One game failing leaves it out of the feed rather than failing the feed.
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
 * Every trophy earned in the last `days` days, newest first. Sony has no feed
 * for this, so it is built from the games whose last trophy falls in the
 * window: one pair of calls per such game, a few games at a time, each cached
 * until that game changes, so after the first load only the games played
 * since cost anything.
 */
export async function psnRecentTrophies(
  accountId: string,
  days: number,
  userId: string | null = null,
  language = DEFAULT_LANGUAGE,
): Promise<PsnRecentTrophy[]> {
  const since = new Date(Date.now() - days * DAY_MS).toISOString()
  const games = (await psnTitles(accountId, userId)).filter((g) => g.lastTrophyAt && g.lastTrophyAt >= since)
  return earnedSince(accountId, games, since, userId, language)
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
      const res = await fetch(`${STORE_CONCEPT_URL}${conceptId}`, { headers: { 'Accept-Language': 'en-US' } })
      if (!res.ok) throw new PsnError(`PlayStation Store answered ${res.status}`)
      const m = /"releaseDate":"(\d{4})-\d{2}-\d{2}T/.exec(await res.text())
      return m ? Number(m[1]) : null
    },
    { shouldCache: (year) => year !== null },
  )
}

/** The response for a PSN call that threw: 503 with no sign-in set up, 403 for a hidden profile, 502 for anything else. */
export function psnFailure(err: unknown, where: string): NextResponse {
  if (err instanceof PsnError && err.notConfigured) {
    return NextResponse.json({ error: 'not-configured' }, { status: 503 })
  }
  if (err instanceof PsnError && err.isPrivate) {
    return NextResponse.json({ error: 'private' }, { status: 403 })
  }
  console.error(`[${where}]`, err)
  return NextResponse.json({ error: 'failed' }, { status: 502 })
}
