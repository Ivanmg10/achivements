export * from './steamAssets'

import { fetchSteam, STEAM_API_BASE } from './fetchSteam'

type QueryValue = string | number | undefined

function qs(params: Record<string, QueryValue>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
}

/**
 * Thin wrappers around the Steam Web API endpoints this app calls, mirroring
 * raClient so both platforms build requests the same way. One function per
 * endpoint+shape actually used.
 */

export function getPlayerSummaries(steamIds: string | string[], apiKey: string) {
  const ids = Array.isArray(steamIds) ? steamIds.join(',') : steamIds
  return fetchSteam(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?${qs({ key: apiKey, steamids: ids })}`)
}

export function getOwnedGames(steamId: string, apiKey: string) {
  return fetchSteam(
    `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?${qs({
      key: apiKey,
      steamid: steamId,
      include_appinfo: 1,
      include_played_free_games: 1,
    })}`,
  )
}

/**
 * Each game's achievement total and the player's unlocked ones, for many games
 * in one call (192 in 0.6 s, measured 2026-10-22). With `max_achievements` at
 * least the game's total, the list it returns is exactly the unlocked ones;
 * unlock times are not included.
 */
export function getTopAchievementsForGames(steamId: string, apiKey: string, appIds: number[]) {
  const input = JSON.stringify({ steamid: steamId, language: 'english', max_achievements: 10000, appids: appIds })
  return fetchSteam(`${STEAM_API_BASE}/IPlayerService/GetTopAchievementsForGames/v1/?${qs({ key: apiKey, input_json: input })}`)
}

export function getRecentlyPlayedGames(steamId: string, apiKey: string, count = 20) {
  return fetchSteam(
    `${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/?${qs({ key: apiKey, steamid: steamId, count })}`,
  )
}

export function getPlayerAchievements(steamId: string, apiKey: string, appId: string | number, lang = 'english') {
  return fetchSteam(
    `${STEAM_API_BASE}/ISteamUserStats/GetPlayerAchievements/v1/?${qs({
      key: apiKey,
      steamid: steamId,
      appid: appId,
      l: lang,
    })}`,
  )
}

export function getSchemaForGame(appId: string | number, apiKey: string, lang = 'english') {
  return fetchSteam(
    `${STEAM_API_BASE}/ISteamUserStats/GetSchemaForGame/v2/?${qs({ key: apiKey, appid: appId, l: lang })}`,
  )
}

/** No key required — this endpoint is public. */
export function getGlobalAchievementPercentages(appId: string | number) {
  return fetchSteam(
    `${STEAM_API_BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?${qs({ gameid: appId })}`,
  )
}

const STORE_API = 'https://store.steampowered.com/api'

/**
 * Store details (developer, publisher, genres, release date, screenshots).
 * No API key; localised by `lang`. Rate-limited harder than the Web API, so
 * callers must cache the result.
 */
export function getAppDetails(appId: string | number, lang = 'english') {
  return fetchSteam(`${STORE_API}/appdetails?${qs({ appids: appId, l: lang })}`)
}

/**
 * Just the store categories (game modes) of a game, in English. Same store
 * rate limit as getAppDetails, so callers must cache it.
 */
export function getAppCategories(appId: string | number) {
  return fetchSteam(`${STORE_API}/appdetails?${qs({ appids: appId, filters: 'categories', l: 'english' })}`)
}

/**
 * Official per-game artwork on Steam's CDN, keyed only by appid. Far better
 * than img_icon_url, which is a 32×32 library icon:
 * - cover: 600×900 portrait capsule (library art)
 * - header: 460×215 store header
 * - hero: 1920×620 library banner
 * - logo: transparent title logo
 */
export function getAppInfo(appId: string | number) {
  return fetchSteam(`https://api.steamcmd.net/v1/info/${appId}`)
}

/**
 * The desktop-shortcut icon: a square .ico, up to 256px for most games
 * (Portal 2, Elden Ring), though some stop at 64 (Fallout 4).
 */

/** The player's Steam level — the nearest thing Steam has to RA's rank. */
export function getSteamLevel(steamId: string, apiKey: string) {
  return fetchSteam(`${STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/?${qs({ key: apiKey, steamid: steamId })}`)
}

/** A custom profile URL's name (steamcommunity.com/id/<name>) to its SteamID64: `{ response: { success: 1, steamid } }`, success 42 when none. */
export function resolveVanityUrl(vanity: string, apiKey: string) {
  return fetchSteam(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?${qs({ key: apiKey, vanityurl: vanity })}`)
}
