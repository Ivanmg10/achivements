import type { PsnFunction } from '@/lib/psnCallStats'
import { NextResponse } from 'next/server'
import {
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
  type TrophyTitle,
} from 'psn-api'
import { readCache, readCacheMany, withSteamCache, writeCache } from '@/lib/steamCache'
import { igdbArt, igdbConfigured, igdbPlatforms, type IgdbArt } from '@/lib/igdbClient'
import type { Enrichment, GameSnapshot, GroupDef, GroupEarned, KnownSet, PlayedGame, PsnSummaryCore, TrophyDef } from '@/lib/psnStore'
import type { PoolAccount } from '@/lib/psnAccounts'
import { psnPoolConfigured, withPsnAccount } from '@/lib/psnPool'
import { maybeMaintainPsnPool } from '@/lib/psnMaintenance'
import { psnAuthorization } from '@/lib/psnTokens'
import { avatarUrl, countTrophies, https, psnNumericId, psnPlatformName } from '@/utils/psnTitles'
import { mapLimit } from '@/utils/utils'
import type { PsnGameProgress, PsnTrophy, TrophyCounts } from '@/types/psn'
import { PsnBusyError, PsnError, PsnSyncing, TIMED_OUT } from '@/lib/psnErrors'
import { spendPsnCall } from '@/lib/psnBudget'
import { needsBaseTrophies, withCompletion } from '@/lib/psnCompletion'
import { psnBaseCompletedAt } from '@/utils/completionDates'

export { PsnBusyError, PsnError, PsnSyncing } from '@/lib/psnErrors'

/**
 * PlayStation Network through psn-api, which speaks Sony's own (unofficial)
 * mobile API. Every call is authenticated as one of the app's service
 * accounts (#178, psnPool), not as the user: any of them can read any profile
 * whose trophies are public. Their NPSSOs and tokens live in the database
 * (psnAccounts, psnTokens), added and renewed from the admin panel.
 *
 * psn-api returns Sony's error bodies instead of throwing, so every response
 * goes through unwrap(). Every request spends its account's budget (psnBudget).
 *
 * Since #179 nothing here serves a page: the sync worker (psnSync) calls these fetchers and stores what they
 * return (psnStore); pages read the store (psnSnapshot). Only linking (the search), verification (the About Me)
 * and the worker reach Sony.
 */

/** psn-api takes no signal, so a hung call is left behind rather than aborted. */
const CALL_TIMEOUT_MS = 8_000
const NOT_FOUND_TTL_MS = 60 * 60 * 1000
/** The most titles Sony returns per page. */
const TITLES_PAGE = 800
/** The most played games Sony returns per page. */
const PLAYED_PAGE = 200
/** Sony refuses more than five ids per trophy-set lookup. */
const LOOKUP_BATCH = 5
/** A game's trophy sets never change, so the lookup is kept a long time. */
const LOOKUP_TTL_MS = 90 * 24 * 60 * 60 * 1000
/** How many played games an enrichment pass looks up the trophy sets of, most recent first. */
const ENRICH_GAMES = 20
/** Requests in flight at once when a list is built game by game: faster than one by one, clear of Sony's limit. */
const PARALLEL = 4
/** The language trophy texts come in when none is asked for. */
export const DEFAULT_LANGUAGE = 'en-US'
/** Sony's language tags for the app's languages. */
const LANGUAGES: Record<string, string> = {
  en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', ja: 'ja-JP', pl: 'pl-PL', pt: 'pt-PT', ru: 'ru-RU',
}

/** The Accept-Language Sony is asked in, from the app's language code. Unknown codes get English. */
export function psnLanguage(lang: string | null | undefined): string {
  return (lang && LANGUAGES[lang]) || DEFAULT_LANGUAGE
}

/** Whether PSN can be called at all: a service account is set up (today's NPSSO is copied in on first use). */
export async function psnConfigured(): Promise<boolean> {
  try {
    return await psnPoolConfigured()
  } catch (err) {
    // The pool's table missing (migration 047 not run) or a database hiccup.
    console.error('[psn] the account pool is unavailable', err)
    return false
  }
}

function unwrap<T>(res: T): T {
  const error = (res as { error?: { message?: string; code?: number } } | null)?.error
  if (error) throw new PsnError(error.message ?? 'PSN error', error.code)
  return res
}

/** One request to Sony with one account: signed in, within its budget, and never longer than the deadline. */
async function attempt<T>(account: PoolAccount, fn: PsnFunction, call: (auth: AuthorizationPayload) => Promise<T>): Promise<T> {
  const auth = await psnAuthorization(account)
  await spendPsnCall(account, fn)
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PsnError('PSN did not answer in time', TIMED_OUT)), CALL_TIMEOUT_MS)
  })
  try {
    return unwrap(await Promise.race([call(auth), deadline]))
  } finally {
    clearTimeout(timer)
  }
}

/**
 * One Sony call, unwrapped and counted under `fn` (psnCallStats), on an account of the pool (#178): the pool
 * picks the account, and moves the call to another when Sony refuses that one (`withPsnAccount`). A hidden
 * profile or any other answer about the profile is thrown at once: retrying it helps no one.
 */
export function psnCall<T>(fn: PsnFunction, call: (auth: AuthorizationPayload) => Promise<T>): Promise<T> {
  maybeMaintainPsnPool()
  return withPsnAccount((account) => attempt(account, fn, call))
}

export { forgetPsnTokens } from '@/lib/psnTokens'


/** The account with exactly this online ID (any case), or null. */
export async function findPsnAccount(username: string): Promise<{ accountId: string; onlineId: string } | null> {
  const wanted = username.toLowerCase()
  // An online ID nobody has is remembered for an hour (#177): typing it again does not ask Sony again.
  const notFound = `psn:notfound:${wanted}`
  if (await readCache<boolean>(notFound)) return null
  const res = await psnCall('search', (auth) => makeUniversalSearch(auth, username, 'SocialAllAccounts'))
  const match = res.domainResponses?.[0]?.results?.find((r) => r.socialMetadata.onlineId.toLowerCase() === wanted)
  if (!match) await writeCache(notFound, true, NOT_FOUND_TTL_MS)
  return match ? { accountId: match.socialMetadata.accountId, onlineId: match.socialMetadata.onlineId } : null
}

export { avatarUrl } from '@/utils/psnTitles'

export type PsnSummary = PsnSummaryCore & {
  games: number
  /** When the library was last read from Sony (ms), and when the refresh button may read it again. */
  syncedAt?: number | null
  nextSyncAt?: number | null
}

/**
 * The headline numbers for one account: 1 request, 2 with the profile (online ID, avatar, About Me), which the
 * worker reads only when something moved or once a day. Without it, `known` keeps the last one read. Throws a
 * PsnError with isPrivate when the trophies are hidden.
 */
export async function fetchPsnSummary(accountId: string, known: PsnSummaryCore | null): Promise<{ summary: PsnSummaryCore; withProfile: boolean }> {
  const summary = await psnCall('summary', (auth) => getUserTrophyProfileSummary(auth, accountId))
  const counts = { trophyLevel: Number(summary.trophyLevel) || 0, tier: summary.tier ?? 1, levelProgress: summary.progress ?? 0, earned: summary.earnedTrophies }
  const moved = !known || JSON.stringify(known.earned) !== JSON.stringify(counts.earned)
  if (known && !moved) return { summary: { ...known, ...counts }, withProfile: false }
  const profile = await psnCall('profile', (auth) => getProfileFromAccountId(auth, accountId))
  return {
    summary: { onlineId: profile.onlineId, avatarUrl: avatarUrl(profile.avatars ?? []), aboutMe: profile.aboutMe ?? '', isPlus: profile.isPlus === true, ...counts },
    withProfile: true,
  }
}

/**
 * The text of an account's About Me, read now and never cached: verification (#176) asks once, when the user
 * presses "check", and the answer must be what the profile says this second. Throws as any call does.
 */
export async function psnAboutMe(accountId: string): Promise<string> {
  const profile = await psnCall('profile', (auth) => getProfileFromAccountId(auth, accountId))
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

// Only a portrait counts as a cover: most PS4 games have none, and their 16:9 hub art cropped to 2:3 was unreadable.
const COVER_TYPES = ['PORTRAIT_BANNER']
const HERO_TYPES = ['BACKGROUND_LAYER_ART', 'SIXTEEN_BY_NINE_BANNER', 'FOUR_BY_THREE_BANNER', 'GAMEHUB_COVER_ART']

function pickImage(images: Array<{ url: string; type: string }>, types: string[]): string | null {
  const found = types.map((type) => images.find((i) => i.type === type)).find(Boolean)
  return found ? https(found.url) : null
}

/** Every game the account has played, with when, for how long and its store art. */
async function playedGames(accountId: string): Promise<PlayedGame[]> {
  const games: PlayedGame[] = []
  for (let offset = 0; ; offset += PLAYED_PAGE) {
    const page = await psnCall('played', (auth) => getUserPlayedGames(auth, accountId, { limit: PLAYED_PAGE, offset }))
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
async function trophySetsOf(accountId: string, titleIds: string[], limit = Infinity): Promise<Map<string, string[]>> {
  const key = (id: string) => `psn:sets:${id}`
  const cached = await readCacheMany<string[]>(titleIds.map(key))
  const found = new Map(titleIds.filter((id) => cached.has(key(id))).map((id) => [id, cached.get(key(id))!]))
  // The first `limit` not known yet, in the order given (most recent first): a background pass is bounded.
  const missing = titleIds.filter((id) => !found.has(id)).slice(0, limit)
  if (missing.length === 0) return found

  const batches: string[][] = []
  for (let i = 0; i < missing.length; i += LOOKUP_BATCH) batches.push(missing.slice(i, i + LOOKUP_BATCH))
  const answers = await mapLimit(batches, PARALLEL, async (batch) => {
    const res = await psnCall('sets', (auth) => getUserTrophiesForSpecificTitle(auth, accountId, { npTitleIds: batch.join(',') }))
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

/** Every game in the account's trophy list, from Sony's title list alone (one request per 800 games), most recent trophy first. */
export async function fetchPsnTitles(accountId: string): Promise<PsnGameProgress[]> {
  const games: PsnGameProgress[] = []
  for (let offset = 0; ; offset += TITLES_PAGE) {
    const page = await psnCall('titles', (auth) => getUserTitles(auth, accountId, { limit: TITLES_PAGE, offset }))
    const titles = page.trophyTitles ?? []
    for (const t of titles) {
      const game = toPsnGameProgress(t)
      if (game) games.push(game)
    }
    if (!page.nextOffset || titles.length === 0) break
  }
  return games.sort((a, b) => (b.lastTrophyAt ?? '').localeCompare(a.lastTrophyAt ?? ''))
}

/**
 * The core with the enrichment laid over it (play data, store and IGDB art) and each game's completion date:
 * a complete game with DLC takes its base game's, from its stored trophies (`completed`), null until they are read.
 */
export function withEnrichment(core: PsnGameProgress[], enrichment: Enrichment | null, completed: (g: PsnGameProgress) => string | null = () => null): PsnGameProgress[] {
  if (!enrichment) return withCompletion(core, completed)
  const played = withPlayData(core, enrichment.played, new Map(Object.entries(enrichment.sets)))
  const art = played.map((g) => {
    const a = enrichment.art[g.titleId]
    return a && !g.coverUrl ? { ...g, coverUrl: a.coverUrl ?? g.coverUrl, heroUrl: a.heroUrl ?? g.heroUrl } : g
  })
  return withCompletion(art, completed)
}

/**
 * One enrichment pass (the worker's, after the trophy list moved, or once a day): the whole played list, the
 * trophy sets of up to ENRICH_GAMES more played games (kept for everyone, so it converges) and IGDB art.
 */
export async function fetchPsnEnrichment(accountId: string, core: PsnGameProgress[]): Promise<Enrichment> {
  let played: PlayedGame[] = []
  try {
    played = await playedGames(accountId)
  } catch (err) {
    // The played-games list is its own privacy setting: hidden, the trophies still show, without play data.
    if (!(err instanceof PsnError && err.isPrivate)) throw err
  }
  const recentFirst = [...played].sort((a, b) => (b.lastPlayed ?? '').localeCompare(a.lastPlayed ?? '')).map((p) => p.titleId)
  const sets = await trophySetsOf(accountId, recentFirst, ENRICH_GAMES)
  return { played, sets: Object.fromEntries(sets), art: await igdbArtFor(withPlayData(core, played, sets)) }
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
 * One game's trophies for the worker (#179), as little as it can ask: the account's earned ones (1 request, none
 * for a game never started), the set's definitions only when the store lacks them in `language` or a DLC brought
 * ids it does not know (1), and, for a game with DLC, its groups (1 for the account's, 1 for the definitions when
 * missing). A game without DLC is one group, built from the list. The rarity comes with the earned ones.
 */
export async function fetchPsnGame(accountId: string, game: PsnGameProgress, known: KnownSet, language: string): Promise<GameSnapshot> {
  const options = { npServiceName: game.service }
  const started = game.numAwarded > 0
  const mine = started ? await earnedTrophies(accountId, game.titleId, options) : []
  const knownIds = new Set(known.known.map((t) => t.id))
  const needDefs = !known.languages.includes(language) || mine.some((t) => !knownIds.has(t.id))
  const [defined, groupDefs, groupsEarned] = await Promise.all([
    needDefs ? definedTrophies(game.titleId, options, language) : null,
    game.hasDlc && !known.groupLanguages.includes(language) ? definedGroups(game.titleId, options, language) : null,
    game.hasDlc && started ? earnedGroups(accountId, game.titleId, options) : null,
  ])
  const earned = mine.filter((t) => t.earned).map((t) => ({ id: t.id, earnedAt: t.earnedAt }))
  return {
    titleId: game.titleId,
    lastTrophyAt: game.lastTrophyAt,
    language,
    defined,
    earned,
    rarity: mine.map((t) => ({ id: t.id, rarity: t.rarity })),
    groupDefs,
    groupsEarned,
    completedAt: needsBaseTrophies(game) ? psnBaseCompletedAt(withEarned(defined ?? known.known, earned)) : null,
  }
}

/** A set's trophies with what was earned, for its completion date (grade and group are all it reads). */
function withEarned(defs: KnownSet['known'], earned: GameSnapshot['earned']): PsnTrophy[] {
  const when = new Map(earned.map((e) => [e.id, e.earnedAt]))
  return defs.map((t) => ({ ...t, name: '', detail: '', iconUrl: null, hidden: false, earned: when.has(t.id), earnedAt: when.get(t.id) ?? null, rarity: null }))
}

type Options = { npServiceName: PsnGameProgress['service'] }

async function earnedTrophies(accountId: string, titleId: string, options: Options): Promise<Array<{ id: number; earned: boolean; earnedAt: string | null; rarity: number | null }>> {
  const res = await psnCall('gameTrophies', (auth) => getUserTrophiesEarnedForTitle(auth, accountId, titleId, 'all', options))
  return (res.trophies ?? []).map((t) => {
    const rate = Number(t.trophyEarnedRate)
    return { id: t.trophyId, earned: t.earned === true, earnedAt: t.earnedDateTime ?? null, rarity: t.trophyEarnedRate && Number.isFinite(rate) ? rate : null }
  })
}

async function definedTrophies(titleId: string, options: Options, language: string): Promise<TrophyDef[]> {
  const res = await psnCall('gameTrophies', (auth) => getTitleTrophies(auth, titleId, 'all', { ...options, headerOverrides: { 'Accept-Language': language } }))
  return (res.trophies ?? []).map((t) => ({
    id: t.trophyId,
    name: t.trophyName ?? '',
    detail: t.trophyDetail ?? '',
    iconUrl: t.trophyIconUrl ? https(t.trophyIconUrl) : null,
    type: t.trophyType,
    groupId: t.trophyGroupId ?? 'default',
    hidden: t.trophyHidden,
  }))
}

async function definedGroups(titleId: string, options: Options, language: string): Promise<GroupDef[]> {
  const res = await psnCall('gameGroups', (auth) => getTitleTrophyGroups(auth, titleId, { ...options, headerOverrides: { 'Accept-Language': language } }))
  return (res.trophyGroups ?? []).map((g) => ({ id: g.trophyGroupId, name: g.trophyGroupName, iconUrl: g.trophyGroupIconUrl ? https(g.trophyGroupIconUrl) : null, defined: g.definedTrophies }))
}

async function earnedGroups(accountId: string, titleId: string, options: Options): Promise<GroupEarned[]> {
  const res = await psnCall('gameGroups', (auth) => getUserTrophyGroupEarningsForTitle(auth, accountId, titleId, options))
  return (res.trophyGroups ?? []).map((g) => ({ id: g.trophyGroupId, earned: g.earnedTrophies as TrophyCounts, progress: g.progress }))
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
