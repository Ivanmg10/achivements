jest.mock('./fetchSteam', () => ({
  ...jest.requireActual('./fetchSteam'),
  fetchSteam: jest.fn(),
}))

import { fetchSteam } from './fetchSteam'
import {
  getPlayerSummaries,
  getOwnedGames,
  getRecentlyPlayedGames,
  getPlayerAchievements,
  getSchemaForGame,
  getGlobalAchievementPercentages,
  gameIconUrl,
  gameLogoUrl,
} from './steamClient'

const KEY = 'api key/with+chars'
const STEAM_ID = '76561198000000000'

function calledUrl() {
  return new URL((fetchSteam as jest.Mock).mock.calls[0][0])
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchSteam as jest.Mock).mockResolvedValue({})
})

test('getPlayerSummaries encodes the key and passes a single id', async () => {
  await getPlayerSummaries(STEAM_ID, KEY)
  const url = calledUrl()
  expect(url.pathname).toBe('/ISteamUser/GetPlayerSummaries/v2/')
  // Decoded by URLSearchParams — proves the raw URL was encoded, not literal.
  expect(url.searchParams.get('key')).toBe(KEY)
  expect(url.searchParams.get('steamids')).toBe(STEAM_ID)
})

test('getPlayerSummaries joins multiple ids into one call', async () => {
  await getPlayerSummaries([STEAM_ID, '76561198000000001'], KEY)
  expect(calledUrl().searchParams.get('steamids')).toBe(`${STEAM_ID},76561198000000001`)
})

test('getOwnedGames asks for app info and free games', async () => {
  await getOwnedGames(STEAM_ID, KEY)
  const url = calledUrl()
  expect(url.pathname).toBe('/IPlayerService/GetOwnedGames/v1/')
  expect(url.searchParams.get('include_appinfo')).toBe('1')
  expect(url.searchParams.get('include_played_free_games')).toBe('1')
})

test('getRecentlyPlayedGames defaults to 20 and honours an override', async () => {
  await getRecentlyPlayedGames(STEAM_ID, KEY)
  expect(calledUrl().searchParams.get('count')).toBe('20')

  ;(fetchSteam as jest.Mock).mockClear()
  await getRecentlyPlayedGames(STEAM_ID, KEY, 5)
  expect(calledUrl().searchParams.get('count')).toBe('5')
})

test('getPlayerAchievements defaults to english and honours a language', async () => {
  await getPlayerAchievements(STEAM_ID, KEY, 730)
  let url = calledUrl()
  expect(url.pathname).toBe('/ISteamUserStats/GetPlayerAchievements/v1/')
  expect(url.searchParams.get('appid')).toBe('730')
  expect(url.searchParams.get('l')).toBe('english')

  ;(fetchSteam as jest.Mock).mockClear()
  await getPlayerAchievements(STEAM_ID, KEY, 730, 'spanish')
  url = calledUrl()
  expect(url.searchParams.get('l')).toBe('spanish')
})

test('getSchemaForGame targets the schema endpoint', async () => {
  await getSchemaForGame(730, KEY, 'spanish')
  const url = calledUrl()
  expect(url.pathname).toBe('/ISteamUserStats/GetSchemaForGame/v2/')
  expect(url.searchParams.get('l')).toBe('spanish')
})

test('getGlobalAchievementPercentages sends no API key', async () => {
  await getGlobalAchievementPercentages(730)
  const url = calledUrl()
  expect(url.pathname).toBe('/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/')
  expect(url.searchParams.get('gameid')).toBe('730')
  expect(url.searchParams.get('key')).toBeNull()
})

describe('image URLs', () => {
  test('builds icon and logo URLs from the appid and hash', () => {
    expect(gameIconUrl(730, 'abc123')).toBe(
      'https://media.steampowered.com/steamcommunity/public/images/apps/730/abc123.jpg',
    )
    expect(gameLogoUrl(730, 'def456')).toBe(
      'https://media.steampowered.com/steamcommunity/public/images/apps/730/def456.jpg',
    )
  })

  test('returns an empty string when Steam gave no hash', () => {
    expect(gameIconUrl(730, undefined)).toBe('')
    expect(gameLogoUrl(730, undefined)).toBe('')
  })
})
