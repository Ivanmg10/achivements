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
