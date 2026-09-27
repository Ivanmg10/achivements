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

const MEDIA_BASE = 'https://media.steampowered.com/steamcommunity/public/images/apps'

/** Steam gives image *hashes*, not URLs — they only resolve with the appid. */
export function gameIconUrl(appId: number, imgIconUrl?: string): string {
  return imgIconUrl ? `${MEDIA_BASE}/${appId}/${imgIconUrl}.jpg` : ''
}

export function gameLogoUrl(appId: number, imgLogoUrl?: string): string {
  return imgLogoUrl ? `${MEDIA_BASE}/${appId}/${imgLogoUrl}.jpg` : ''
}

const STORE_API = 'https://store.steampowered.com/api'
const APP_ASSETS = 'https://cdn.akamai.steamstatic.com/steam/apps'

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
export type SteamAsset = 'cover' | 'header' | 'hero' | 'logo'

const ASSET_FILES: Record<SteamAsset, string> = {
  cover: 'library_600x900.jpg',
  header: 'header.jpg',
  hero: 'library_hero.jpg',
  logo: 'logo.png',
}

export function steamAssetUrl(appId: number, asset: SteamAsset): string {
  return `${APP_ASSETS}/${appId}/${ASSET_FILES[asset]}`
}

/** The game's page on the Steam store. */
export function steamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}`
}

/** The player's Steam level — the nearest thing Steam has to RA's rank. */
export function getSteamLevel(steamId: string, apiKey: string) {
  return fetchSteam(`${STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/?${qs({ key: apiKey, steamid: steamId })}`)
}
