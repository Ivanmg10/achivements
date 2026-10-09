import { withSteamCache } from '@/lib/steamCache'

/**
 * IGDB (Twitch's game database), for what Sony keeps nothing of on PS3 and
 * Vita games: cover, backdrop and release year. PS4/PS5 games get those from
 * the PlayStation Store; these have no Store page left.
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

type IgdbGame = {
  name: string
  first_release_date?: number
  cover?: { image_id: string }
  artworks?: { image_id: string }[]
  screenshots?: { image_id: string }[]
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

/** The art for the best match: the exact title if IGDB has it, else its first hit. */
export function toIgdbArt(title: string, games: IgdbGame[]): IgdbArt | null {
  const game = games.find((g) => titleKey(g.name) === titleKey(title)) ?? games[0]
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
  const platforms = igdbPlatforms(consoleName)
  if (!igdbConfigured() || platforms.length === 0) return null
  const name = title.replace(/[®™©]/g, '').trim()
  // A miss is cached too ({ art: null }): the cache reads a bare null as "not cached".
  const { art } = await withSteamCache<{ art: IgdbArt | null }>(`igdb:art:v2:${platforms.join(',')}:${titleKey(name)}`, ART_TTL_MS, async () => {
    const query = `search "${name.replace(/["\\]/g, ' ')}"; fields name,first_release_date,cover.image_id,artworks.image_id,screenshots.image_id; where platforms = (${platforms.join(',')}); limit 10;`
    return { art: toIgdbArt(name, await searchGames(query)) }
  })
  return art
}
