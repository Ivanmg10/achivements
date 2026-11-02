jest.mock('@/app/api/getRecentAchievements/route', () => ({ GET: jest.fn() }))
jest.mock('@/app/api/getGamesCompleted/route', () => ({ GET: jest.fn() }))
jest.mock('@/app/api/steam/activity/route', () => ({ GET: jest.fn() }))
jest.mock('@/app/api/steam/ownedGames/route', () => ({ GET: jest.fn() }))
jest.mock('@/app/api/psn/recentTrophies/route', () => ({ GET: jest.fn() }))
jest.mock('@/app/api/psn/titles/route', () => ({ GET: jest.fn() }))
jest.mock('@/app/api/xbox/recentAchievements/route', () => ({ GET: jest.fn() }))
jest.mock('@/app/api/xbox/titles/route', () => ({ GET: jest.fn() }))

import { loadFriendCards } from './friendCards'
import { GET as raRecent } from '@/app/api/getRecentAchievements/route'
import { GET as raGames } from '@/app/api/getGamesCompleted/route'
import { GET as steamActivity } from '@/app/api/steam/activity/route'
import { GET as psnRecent } from '@/app/api/psn/recentTrophies/route'
import { GET as xboxTitles } from '@/app/api/xbox/titles/route'
import type { FriendOverview } from '@/utils/friends'

const ORIGIN = 'http://localhost:3000'
const friend = (username: string, over: Partial<FriendOverview> = {}): FriendOverview => ({
  username, avatar: null, ra: true, steam: false, psn: false, favorites: { ra: null, steam: null, psn: null }, publicGroups: 0, showcase: [], ...over,
})

const RA_RECENT = [{ Date: '2026-10-14 08:00:00', Title: 'A' }]
const RA_GAMES = [
  { GameID: 1, Title: 'Zelda', ImageIcon: '', ConsoleID: 3, ConsoleName: 'SNES', MaxPossible: 1, NumAwarded: 1, PctWon: '1', HardcoreMode: '1' },
  { GameID: 9, Title: 'Event', ImageIcon: '', ConsoleID: 101, ConsoleName: 'Events', MaxPossible: 1, NumAwarded: 1, PctWon: '1', HardcoreMode: '1' },
]
const answer = (body: unknown, ok = true) => Promise.resolve({ ok, status: ok ? 200 : 503, json: async () => body })
const urlOf = (mock: unknown, call = 0) => String((mock as jest.Mock).mock.calls[call][0].url)

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(raRecent as jest.Mock).mockImplementation(() => answer(RA_RECENT))
  ;(raGames as jest.Mock).mockImplementation(() => answer(RA_GAMES))
})

test('reads only the platforms they linked, through their profile\'s routes, as them', async () => {
  const { 'a b': d } = await loadFriendCards(ORIGIN, [friend('a b')], 'en', 1)
  expect(urlOf(raRecent)).toBe(`${ORIGIN}/api/getRecentAchievements?user=a%20b`)
  expect(urlOf(raGames)).toBe(`${ORIGIN}/api/getGamesCompleted?user=a%20b`)
  expect(steamActivity).not.toHaveBeenCalled()
  expect(xboxTitles).not.toHaveBeenCalled()
  expect(d.recent).toHaveLength(1)
  // RA's system consoles are not games; each game opens their progress.
  expect(d.games.map((g) => g.href)).toEqual(['/user/a%20b/ra/1'])
  // RA says nothing of play time: the game of the latest unlock is the last one played.
  expect(d.lastPlayed).toMatchObject({ source: 'ra', at: '2026-10-14 08:00:00' })
  expect(d.partial).toBe(false)
})

test('a platform that fails leaves the rest, and says the numbers may be short', async () => {
  ;(steamActivity as jest.Mock).mockImplementation(() => answer({}, false))
  ;(psnRecent as jest.Mock).mockImplementation(() => answer([]))
  const { x: d } = await loadFriendCards(ORIGIN, [friend('x', { steam: true, psn: true })], 'es', 1)
  expect(urlOf(steamActivity)).toBe(`${ORIGIN}/api/steam/activity?lang=spanish&user=x`)
  expect(urlOf(psnRecent)).toBe(`${ORIGIN}/api/psn/recentTrophies?scope=activity&lang=es&user=x`)
  expect(d.partial).toBe(true)
  expect(d.recent).toHaveLength(1)
})

test('an answer that is not a list counts as a failure', async () => {
  ;(raRecent as jest.Mock).mockImplementation(() => answer({ nope: true }))
  expect((await loadFriendCards(ORIGIN, [friend('x')], 'en', 1)).x.partial).toBe(true)
})

test('Xbox only when the overview says the friend has it (only for a viewer who may see it)', async () => {
  ;(xboxTitles as jest.Mock).mockImplementation(() => answer([]))
  await loadFriendCards(ORIGIN, [friend('x', { ra: false, xbox: true })], 'en', 1)
  expect(urlOf(xboxTitles)).toBe(`${ORIGIN}/api/xbox/titles?user=x`)
})

test('one person at a time when asked to, as the browser read them', async () => {
  const pending: (() => void)[] = []
  ;(raRecent as jest.Mock).mockImplementation(() => new Promise((resolve) => pending.push(() => resolve({ ok: true, json: async () => [] }))))
  const done = loadFriendCards(ORIGIN, [friend('f1'), friend('f2')], 'en', 1)
  await new Promise((r) => setTimeout(r, 0))
  expect((raRecent as jest.Mock).mock.calls).toHaveLength(1)
  pending.shift()!()
  await new Promise((r) => setTimeout(r, 0))
  expect((raRecent as jest.Mock).mock.calls).toHaveLength(2)
  pending.shift()!()
  expect(Object.keys(await done)).toEqual(['f1', 'f2'])
})
