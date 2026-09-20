jest.mock('./fetchRA', () => ({ fetchRA: jest.fn() }))

import { fetchRA } from './fetchRA'
import * as raClient from './raClient'

beforeEach(() => {
  jest.clearAllMocks()
})

test('getUserProfile builds the expected URL', () => {
  raClient.getUserProfile('ivan', 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetUserProfile.php?u=ivan&y=key')
})

test('getGame builds the expected URL', () => {
  raClient.getGame(123, 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetGame.php?i=123&y=key')
})

test('getGameExtended builds the expected URL', () => {
  raClient.getGameExtended(123, 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetGameExtended.php?i=123&y=key')
})

test('getGameInfoAndUserProgress builds the expected URL', () => {
  raClient.getGameInfoAndUserProgress('ivan', 'key', 456)
  expect(fetchRA).toHaveBeenCalledWith(
    'https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?u=ivan&y=key&g=456',
  )
})

test('getGameHashes builds the expected URL', () => {
  raClient.getGameHashes(123, 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetGameHashes.php?y=key&i=123')
})

test('getGameComments builds the expected URL', () => {
  raClient.getGameComments(123, 'key')
  expect(fetchRA).toHaveBeenCalledWith(
    'https://retroachievements.org/API/API_GetComments.php?i=123&t=1&c=100&y=key',
  )
})

test('getAchievementComments builds the expected URL', () => {
  raClient.getAchievementComments('ivan', 'key', 789)
  expect(fetchRA).toHaveBeenCalledWith(
    'https://retroachievements.org/API/API_GetComments.php?z=ivan&y=key&i=789&t=2&c=500',
  )
})

test('getAchievementUnlocks builds the expected URL', () => {
  raClient.getAchievementUnlocks('ivan', 'key', 789)
  expect(fetchRA).toHaveBeenCalledWith(
    'https://retroachievements.org/API/API_GetAchievementUnlocks.php?z=ivan&y=key&a=789&c=10',
  )
})

test('getGameList omits the achievements filter by default', () => {
  raClient.getGameList(7, 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetGameList.php?i=7&y=key')
})

test('getGameList includes f=1 when onlyWithAchievements is true', () => {
  raClient.getGameList(7, 'key', true)
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetGameList.php?i=7&y=key&f=1')
})

test('getUserCompletedGames builds the expected URL', () => {
  raClient.getUserCompletedGames('ivan', 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetUserCompletedGames.php?u=ivan&y=key')
})

test('getUserAwards builds the expected URL', () => {
  raClient.getUserAwards('ivan', 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetUserAwards.php?u=ivan&y=key')
})

test('getUserRankAndScore builds the expected URL', () => {
  raClient.getUserRankAndScore('ivan', 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetUserRankAndScore.php?u=ivan&y=key')
})

test('getUserWantToPlayList builds the expected URL', () => {
  raClient.getUserWantToPlayList('ivan', 'key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetUserWantToPlayList.php?u=ivan&y=key')
})

test('getTopTenUsers builds the expected URL', () => {
  raClient.getTopTenUsers('key')
  expect(fetchRA).toHaveBeenCalledWith('https://retroachievements.org/API/API_GetTopTenUsers.php?y=key')
})

test('getUserRecentAchievements builds the expected URL', () => {
  raClient.getUserRecentAchievements('ivan', 'key', 20160, 500)
  expect(fetchRA).toHaveBeenCalledWith(
    'https://retroachievements.org/API/API_GetUserRecentAchievements.php?u=ivan&y=key&m=20160&c=500',
  )
})

test('getUserRecentlyPlayedGames builds the expected URL', () => {
  raClient.getUserRecentlyPlayedGames('ivan', 'key', 500)
  expect(fetchRA).toHaveBeenCalledWith(
    'https://retroachievements.org/API/API_GetUserRecentlyPlayedGames.php?u=ivan&y=key&c=500',
  )
})

test('getAchievementsEarnedBetween builds the expected URL', () => {
  raClient.getAchievementsEarnedBetween('ivan', 'key', 100, 200)
  expect(fetchRA).toHaveBeenCalledWith(
    'https://retroachievements.org/API/API_GetAchievementsEarnedBetween.php?u=ivan&y=key&f=100&t=200',
  )
})

test('encodes usernames and keys that need escaping', () => {
  raClient.getUserProfile('some user/name', 'key&x')
  expect(fetchRA).toHaveBeenCalledWith(
    'https://retroachievements.org/API/API_GetUserProfile.php?u=some%20user%2Fname&y=key%26x',
  )
})
