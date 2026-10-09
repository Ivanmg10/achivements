import { getPlayerSummaries, resolveVanityUrl } from '@/lib/steamClient'

/** A Steam account as people name it: by its number, or by its custom profile URL's name. */
export type SteamQuery = { steamid: string } | { vanity: string }

export type SteamAccount = {
  steamid: string
  personaname: string
  /** A public profile — without one Steam shows nothing of the library. */
  isPublic: boolean
}

const STEAMID64 = /^\d{17}$/
/** Steam's custom URL names: 2–32 letters, digits, - or _. */
const VANITY = /^[A-Za-z0-9_-]{2,32}$/
const PROFILE_LINK = /^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/(profiles|id)\/([^/?#]+)/i

/** Steam's "public" community visibility state. */
const PUBLIC = 3

/**
 * What someone pastes to name a Steam account: a SteamID64, a profile link
 * (`steamcommunity.com/profiles/<id>` or `/id/<name>`), or a custom URL name
 * alone. Null for anything else.
 */
export function parseSteamQuery(input: unknown): SteamQuery | null {
  if (typeof input !== 'string') return null
  const value = input.trim().replace(/\/+$/, '')
  if (STEAMID64.test(value)) return { steamid: value }
  const link = value.match(PROFILE_LINK)
  const [kind, name] = link ? [link[1].toLowerCase(), link[2]] : ['id', value]
  if (kind === 'profiles') return STEAMID64.test(name) ? { steamid: name } : null
  return VANITY.test(name) ? { vanity: name } : null
}

/** Only a SteamID64 or a `/profiles/<id>` link, as the admin panel takes. */
export function readSteamId(value: unknown): string | null {
  const query = parseSteamQuery(value)
  return query && 'steamid' in query ? query.steamid : null
}

/**
 * The account a query names, read from Steam: a custom URL is resolved to its
 * SteamID64 first. Null when Steam has no such account. Throws when Steam
 * cannot be reached, so a caller can tell "no account" from "try again".
 */
export async function findSteamAccount(query: SteamQuery, apiKey: string): Promise<SteamAccount | null> {
  let steamid: string
  if ('vanity' in query) {
    const resolved = (await resolveVanityUrl(query.vanity, apiKey)) as { response?: { success?: number; steamid?: string } }
    if (resolved?.response?.success !== 1 || !resolved.response.steamid) return null
    steamid = resolved.response.steamid
  } else {
    steamid = query.steamid
  }

  const data = (await getPlayerSummaries(steamid, apiKey)) as {
    response?: { players?: { personaname?: string; communityvisibilitystate?: number }[] }
  }
  const player = data?.response?.players?.[0]
  if (!player) return null
  return { steamid, personaname: player.personaname ?? '', isPublic: player.communityvisibilitystate === PUBLIC }
}
