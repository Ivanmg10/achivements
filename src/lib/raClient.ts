import { fetchRA } from './fetchRA'

const BASE = 'https://retroachievements.org/API'

type QueryValue = string | number | undefined

function qs(params: Record<string, QueryValue>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
}

/**
 * Thin wrappers around each RetroAchievements REST endpoint this app calls,
 * so every route builds requests the same way (consistent param encoding,
 * shared retry/timeout via fetchRA) instead of hand-assembling URL strings.
 * One function per endpoint+shape actually used in src/app/api/*.
 */

export function getUserProfile(username: string, apiKey: string) {
  return fetchRA(`${BASE}/API_GetUserProfile.php?${qs({ u: username, y: apiKey })}`)
}

export function getGame(gameId: string | number, apiKey: string) {
  return fetchRA(`${BASE}/API_GetGame.php?${qs({ i: gameId, y: apiKey })}`)
}

export function getGameExtended(gameId: string | number, apiKey: string) {
  return fetchRA(`${BASE}/API_GetGameExtended.php?${qs({ i: gameId, y: apiKey })}`)
}

export function getGameInfoAndUserProgress(username: string, apiKey: string, gameId: string | number) {
  return fetchRA(`${BASE}/API_GetGameInfoAndUserProgress.php?${qs({ u: username, y: apiKey, g: gameId })}`)
}

export function getGameHashes(gameId: string | number, apiKey: string) {
  return fetchRA(`${BASE}/API_GetGameHashes.php?${qs({ y: apiKey, i: gameId })}`)
}

export function getGameComments(gameId: string | number, apiKey: string) {
  return fetchRA(`${BASE}/API_GetComments.php?${qs({ i: gameId, t: 1, c: 100, y: apiKey })}`)
}

export function getAchievementComments(username: string, apiKey: string, achievementId: string | number) {
  return fetchRA(`${BASE}/API_GetComments.php?${qs({ z: username, y: apiKey, i: achievementId, t: 2, c: 500 })}`)
}

export function getAchievementUnlocks(username: string, apiKey: string, achievementId: string | number) {
  return fetchRA(`${BASE}/API_GetAchievementUnlocks.php?${qs({ z: username, y: apiKey, a: achievementId, c: 10 })}`)
}

export function getGameList(consoleId: string | number, apiKey: string, onlyWithAchievements = false) {
  return fetchRA(`${BASE}/API_GetGameList.php?${qs({ i: consoleId, y: apiKey, f: onlyWithAchievements ? 1 : undefined })}`)
}

export function getUserCompletedGames(username: string, apiKey: string) {
  return fetchRA(`${BASE}/API_GetUserCompletedGames.php?${qs({ u: username, y: apiKey })}`)
}

export function getUserAwards(username: string, apiKey: string) {
  return fetchRA(`${BASE}/API_GetUserAwards.php?${qs({ u: username, y: apiKey })}`)
}

export function getUserRankAndScore(username: string, apiKey: string) {
  return fetchRA(`${BASE}/API_GetUserRankAndScore.php?${qs({ u: username, y: apiKey })}`)
}

export function getUserWantToPlayList(username: string, apiKey: string) {
  return fetchRA(`${BASE}/API_GetUserWantToPlayList.php?${qs({ u: username, y: apiKey })}`)
}

export function getTopTenUsers(apiKey: string) {
  return fetchRA(`${BASE}/API_GetTopTenUsers.php?${qs({ y: apiKey })}`)
}

export function getUserRecentAchievements(username: string, apiKey: string, minutes: number, count: number) {
  return fetchRA(`${BASE}/API_GetUserRecentAchievements.php?${qs({ u: username, y: apiKey, m: minutes, c: count })}`)
}

export function getUserRecentlyPlayedGames(username: string, apiKey: string, count: number) {
  return fetchRA(`${BASE}/API_GetUserRecentlyPlayedGames.php?${qs({ u: username, y: apiKey, c: count })}`)
}

export function getAchievementsEarnedBetween(username: string, apiKey: string, fromTs: number, toTs: number) {
  return fetchRA(`${BASE}/API_GetAchievementsEarnedBetween.php?${qs({ u: username, y: apiKey, f: fromTs, t: toTs })}`)
}
