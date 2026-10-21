import { withSteamCache } from '@/lib/steamCache'

/**
 * IGDB (Twitch's game database), for what Sony keeps nothing of on PS3 and
 * Vita games: cover, backdrop and release year. PS4/PS5 games get those from
 * the PlayStation Store; these have no Store page left. Every PSN game page
 * also takes its summary, studios, genres and screenshots from here
 * (igdbDetails), which Sony gives for none.
 *
 * Needs a Twitch app (TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET, dev.twitch.tv).
 * Without it every lookup is null and the games keep their trophy-list icon.
 */

export type IgdbArt = {
  coverUrl: string | null
  heroUrl: string | null
  releaseYear: number | null
}

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const GAMES_URL = 'https://api.igdb.com/v4/games'
const IMAGE_URL = 'https://images.igdb.com/igdb/image/upload'

/** IGDB's platform ids. */

/** A game's art does not change; kept half a year, misses included. */
const ART_TTL_MS = 180 * 24 * 60 * 60 * 1000
/** Renew the app token this long before Twitch says it ends. */
const TOKEN_MARGIN_MS = 60 * 60 * 1000

export class IgdbError extends Error {}

/** A PSN game page's facts: what Steam's store gives a Steam page. In English, IGDB's only language. */
export type IgdbDetails = {
  summary: string | null
  developers: string[]
  publishers: string[]
  genres: string[]
  /** "YYYY-MM-DD". */
  releaseDate: string | null
  screenshots: { thumb: string; full: string }[]
}

type IgdbGame = {
  name: string
  first_release_date?: number
  cover?: { image_id: string }
  artworks?: { image_id: string }[]
  screenshots?: { image_id: string }[]
  summary?: string
  genres?: { name: string }[]
  involved_companies?: { developer?: boolean; publisher?: boolean; company?: { name: string } }[]
}

let token: { value: string; expiresAt: number } | null = null

export function igdbConfigured(): boolean {
  return Boolean(process.env.TWITCH_CLIENT_ID?.trim() && process.env.TWITCH_CLIENT_SECRET?.trim())
}

/** Twitch's app token (client credentials), kept in memory until shortly before it ends. */
async function appToken(): Promise<string> {
  if (token && token.expiresAt > Date.now()) return token.value
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID!.trim(),
    client_secret: process.env.TWITCH_CLIENT_SECRET!.trim(),
    grant_type: 'client_credentials',
  })
  const res = await fetch(`${TOKEN_URL}?${params}`, { method: 'POST' })
  if (!res.ok) throw new IgdbError(`Twitch token answered ${res.status}`)
  const body = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!body.access_token) throw new IgdbError('Twitch token response had no token')
  token = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 0) * 1000 - TOKEN_MARGIN_MS }
  return token.value
}

async function searchGames(query: string): Promise<IgdbGame[]> {
  const send = async () =>
    fetch(GAMES_URL, {
      method: 'POST',
      headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID!.trim(), Authorization: `Bearer ${await appToken()}` },
      body: query,
    })
  let res = await send()
  // A token Twitch revoked early: get a new one and try once more.
  if (res.status === 401) {
    token = null
    res = await send()
  }
  if (!res.ok) throw new IgdbError(`IGDB answered ${res.status}`)
  return (await res.json()) as IgdbGame[]
}

/** A title as a comparable key: no ®/™, case, accents or punctuation. */
export function titleKey(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** A game's platforms ("PS3", "PS Vita", "PS3 · PS Vita", or Sony's raw "PSVITA") as IGDB ids — PS3 9, Vita 46; empty for PS4/PS5. */
export function igdbPlatforms(consoleName: string): number[] {
  return [/PS3/i.test(consoleName) && 9, /VITA/i.test(consoleName) && 46].filter((id): id is number => id !== false)
}

/** Every PlayStation a trophy list can be on, as IGDB ids — PS3 9, Vita 46, PS4 48, PS5 167. */
export function igdbPsnPlatforms(consoleName: string): number[] {
  const ids: [RegExp, number][] = [[/PS3/i, 9], [/VITA/i, 46], [/PS4/i, 48], [/PS5/i, 167]]
  return ids.filter(([re]) => re.test(consoleName)).map(([, id]) => id)
}

/**
 * Every Xbox a library can be on, as IGDB ids — Xbox 360 12, Xbox One 49,
 * Xbox Series X|S 169, PC 6 — from the names the library writes ("Xbox Series · PC").
 */
export function igdbXboxPlatforms(consoleName: string): number[] {
  // A 360 game lists the newer consoles it runs on too; searching them finds the newer game of the same name (MW3 2011 → 2023).
  if (/Xbox 360/i.test(consoleName)) return [12]
  const ids: [RegExp, number][] = [[/Xbox 360/i, 12], [/Xbox One/i, 49], [/Xbox Series/i, 169], [/\bPC\b/, 6]]
  return ids.filter(([re]) => re.test(consoleName)).map(([, id]) => id)
}

/** The best match: the exact title if IGDB has it, else one that ends with it (Xbox's "Modern Warfare 3" is "Call of Duty: Modern Warfare 3"), else its first hit. */
function bestMatch(title: string, games: IgdbGame[]): IgdbGame | undefined {
  const key = titleKey(title)
  return games.find((g) => titleKey(g.name) === key) ?? games.find((g) => titleKey(g.name).endsWith(` ${key}`)) ?? games[0]
}

/** The art for the best match. */
export function toIgdbArt(title: string, games: IgdbGame[]): IgdbArt | null {
  const game = bestMatch(title, games)
  if (!game) return null
  const backdrop = game.artworks?.[0] ?? game.screenshots?.[0]
  return {
    coverUrl: game.cover ? `${IMAGE_URL}/t_cover_big_2x/${game.cover.image_id}.jpg` : null,
    heroUrl: backdrop ? `${IMAGE_URL}/t_1080p/${backdrop.image_id}.jpg` : null,
    releaseYear: game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : null,
  }
}

/**
 * Cover, backdrop and release year of a PS3/Vita game, looked up by its title
 * on its platforms. Null when IGDB is not set up, the game is not PS3/Vita,
 * or IGDB has no match. Throws when IGDB cannot be reached (not cached, so a
 * later call tries again).
 */
export async function igdbArt(title: string, consoleName: string): Promise<IgdbArt | null> {
  return artOn(title, igdbPlatforms(consoleName))
}

/** The same lookup for an Xbox game: its cover, backdrop and release year, which Xbox's library has none of. */
export async function igdbXboxArt(title: string, consoleName: string): Promise<IgdbArt | null> {
  return artOn(title, igdbXboxPlatforms(consoleName))
}

async function artOn(title: string, platforms: number[]): Promise<IgdbArt | null> {
  if (!igdbConfigured() || platforms.length === 0) return null
  const name = title.replace(/[®™©]/g, '').trim()
  // A miss is cached too ({ art: null }): the cache reads a bare null as "not cached".
  const { art } = await withSteamCache<{ art: IgdbArt | null }>(`igdb:art:v2:${platforms.join(',')}:${titleKey(name)}`, ART_TTL_MS, async () => {
    const query = `search "${name.replace(/["\\]/g, ' ')}"; fields name,first_release_date,cover.image_id,artworks.image_id,screenshots.image_id; where platforms = (${platforms.join(',')}); limit 10;`
    return { art: toIgdbArt(name, await searchGames(query)) }
  })
  return art
}

/** The facts for the best match; screenshots as a small and a full-size picture. */
export function toIgdbDetails(title: string, games: IgdbGame[]): IgdbDetails | null {
  const game = bestMatch(title, games)
  if (!game) return null
  const companies = (role: 'developer' | 'publisher') =>
    (game.involved_companies ?? []).filter((c) => c[role] && c.company?.name).map((c) => c.company!.name)
  return {
    summary: game.summary?.trim() || null,
    developers: companies('developer'),
    publishers: companies('publisher'),
    genres: (game.genres ?? []).map((g) => g.name),
    releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().slice(0, 10) : null,
    screenshots: (game.screenshots ?? []).map((s) => ({
      thumb: `${IMAGE_URL}/t_screenshot_med/${s.image_id}.jpg`,
      full: `${IMAGE_URL}/t_1080p/${s.image_id}.jpg`,
    })),
  }
}

/**
 * Summary, studios, genres, release date and screenshots of a PSN game,
 * looked up by its title on its platforms. Null when IGDB is not set up or
 * has no match; throws when IGDB cannot be reached (not cached, so a later
 * call tries again).
 */
export async function igdbDetails(title: string, consoleName: string): Promise<IgdbDetails | null> {
  return detailsOn(title, igdbPsnPlatforms(consoleName))
}

/** The same for an Xbox game's page. */
export async function igdbXboxDetails(title: string, consoleName: string): Promise<IgdbDetails | null> {
  return detailsOn(title, igdbXboxPlatforms(consoleName))
}

async function detailsOn(title: string, platforms: number[]): Promise<IgdbDetails | null> {
  if (!igdbConfigured() || platforms.length === 0) return null
  const name = title.replace(/[®™©]/g, '').trim()
  const { details } = await withSteamCache<{ details: IgdbDetails | null }>(
    `igdb:details:v1:${platforms.join(',')}:${titleKey(name)}`,
    ART_TTL_MS,
    async () => {
      const query = `search "${name.replace(/["\\]/g, ' ')}"; fields name,summary,first_release_date,genres.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,screenshots.image_id; where platforms = (${platforms.join(',')}); limit 10;`
      return { details: toIgdbDetails(name, await searchGames(query)) }
    },
  )
  return details
}
