jest.mock('@/lib/raYear', () => ({ loadRaYear: jest.fn() }))
jest.mock('@/lib/steamUnlockYear', () => ({ loadSteamYear: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({ psnLanguage: (l: string) => l }))
jest.mock('@/lib/psnSnapshot', () => ({ psnRecentTrophies: jest.fn(), psnTitlesCore: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({ xboxLanguage: (l: string) => l, xboxRecentAchievements: jest.fn(), xboxLibrary: jest.fn() }))
jest.mock('@/lib/gameVisibility', () => ({ visibleGamesForUser: jest.fn(async (_id, games) => games) }))
jest.mock('@/utils/psnMappers', () => ({ psnToRecentAchievement: (t: { gameId: number; date: string }) => ({ Date: t.date, GameID: t.gameId, Source: 'psn' }) }))
jest.mock('@/utils/xboxMappers', () => ({ xboxToRecentAchievement: (a: { gameId: number; date: string }) => ({ Date: a.date, GameID: a.gameId, Source: 'xbox' }) }))
jest.mock('@/utils/steamMappers', () => ({ toRecentAchievement: (a: { appId: number; date: string }) => ({ Date: a.date, GameID: a.appId, Source: 'steam' }) }))

import { loadStreak, parseHiddenConsoles, StreakUnavailable } from './meStreak'
import { loadRaYear } from '@/lib/raYear'
import { loadSteamYear } from '@/lib/steamUnlockYear'
import { psnRecentTrophies, psnTitlesCore } from '@/lib/psnSnapshot'
import { xboxRecentAchievements } from '@/lib/xboxClient'
import { visibleGamesForUser } from '@/lib/gameVisibility'

const NOW = Date.parse('2026-11-02T12:00:00Z')
const ra = (date: string, console = 'SNES') => ({ Date: `${date} 10:00:00`, GameID: 1, ConsoleName: console })

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'key'
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('counts the days on the calendar of the person: 23:50 UTC on Nov 18 is Nov 19 in Madrid (2026-11-19)', async () => {
  ;(loadRaYear as jest.Mock).mockResolvedValue([{ Date: '2026-11-17 20:00:00', GameID: 1, ConsoleName: 'SNES' }, { Date: '2026-11-18 12:00:00', GameID: 1, ConsoleName: 'SNES' }, { Date: '2026-11-18 23:50:00', GameID: 1, ConsoleName: 'SNES' }])
  const at = Date.parse('2026-11-19T09:00:00Z')
  const madrid = await loadStreak({ id: '1', rausername: 'me', raid: 'k' }, 'en', {}, 'Europe/Madrid', at)
  expect(madrid.active).toEqual({ start: '2026-11-17', end: '2026-11-19', days: 3 })
  const utc = await loadStreak({ id: '1', rausername: 'me', raid: 'k' }, 'en', {}, 'UTC', at)
  expect(utc.active).toEqual({ start: '2026-11-17', end: '2026-11-18', days: 2 })
})

test('counts the current and best streak across every linked platform', async () => {
  ;(loadRaYear as jest.Mock).mockResolvedValue([ra('2026-11-02'), ra('2026-10-20'), ra('2026-10-21'), ra('2026-10-22')])
  ;(loadSteamYear as jest.Mock).mockResolvedValue([{ appId: 9, date: '2026-11-01 08:00:00' }])
  const result = await loadStreak({ id: '1', rausername: 'me', raid: 'k', steamid: 's' }, 'en', {}, 'UTC', NOW)
  expect(result).toEqual({
    active: { start: '2026-11-01', end: '2026-11-02', days: 2 },
    best: { start: '2026-10-20', end: '2026-10-22', days: 3 },
    failed: [],
  })
  expect(visibleGamesForUser).toHaveBeenCalledWith('1', expect.any(Array), 'ra', expect.any(Function))
  // The same Steam cache the pages fill: the language they ask in.
  expect(loadSteamYear).toHaveBeenCalledWith({ id: '1', steamid: 's', apiKey: 'key' }, 'english')
})

test('a platform that fails is named and the streak is counted from the rest', async () => {
  ;(loadRaYear as jest.Mock).mockResolvedValue([ra('2026-11-02')])
  ;(psnRecentTrophies as jest.Mock).mockRejectedValue(new Error('sony'))
  const result = await loadStreak({ id: '1', rausername: 'me', raid: 'k', psnaccountid: 'p' }, 'en', {}, 'UTC', NOW)
  expect(result.failed).toEqual(['psn'])
  expect(result.active?.days).toBe(1)
})

test('every platform failing is not "no streak"', async () => {
  ;(loadRaYear as jest.Mock).mockRejectedValue(new Error('ra'))
  await expect(loadStreak({ id: '1', rausername: 'me', raid: 'k' }, 'en', {}, 'UTC', NOW)).rejects.toBeInstanceOf(StreakUnavailable)
})

test('nothing linked is no streak, without asking anyone', async () => {
  expect(await loadStreak({ id: '1' }, 'en', {}, 'UTC', NOW)).toEqual({ active: null, best: null, failed: [] })
  expect(loadRaYear).not.toHaveBeenCalled()
})

test('unticked consoles leave the count; PSN looks its games up only then', async () => {
  ;(loadRaYear as jest.Mock).mockResolvedValue([ra('2026-11-02', 'Game Boy')])
  ;(psnRecentTrophies as jest.Mock).mockResolvedValue([{ gameId: 5, date: '2026-11-01 08:00:00' }])
  ;(psnTitlesCore as jest.Mock).mockResolvedValue([{ id: 5, consoleName: 'PS3' }])
  const owner = { id: '1', rausername: 'me', raid: 'k', psnaccountid: 'p' }
  const result = await loadStreak(owner, 'en', { ra: new Set(['Game Boy']), psn: new Set(['PS3']) }, 'UTC', NOW)
  expect(result.active).toBeNull()

  ;(psnTitlesCore as jest.Mock).mockClear()
  await loadStreak(owner, 'en', {}, 'UTC', NOW)
  expect(psnTitlesCore).not.toHaveBeenCalled()
})

test('Xbox only for whoever may use it', async () => {
  ;(xboxRecentAchievements as jest.Mock).mockResolvedValue([{ gameId: 3, date: '2026-11-02 08:00:00' }])
  expect((await loadStreak({ id: '1', xboxxuid: 'x', admin: false }, 'en', {}, 'UTC', NOW)).active).toBeNull()
  expect(xboxRecentAchievements).not.toHaveBeenCalled()
  expect((await loadStreak({ id: '1', xboxxuid: 'x', admin: true }, 'en', {}, 'UTC', NOW)).active?.days).toBe(1)
})

describe('parseHiddenConsoles', () => {
  test('reads the browser lists', () => {
    expect(parseHiddenConsoles('{"psn":["PS3"],"ra":[]}')).toEqual({ psn: new Set(['PS3']), ra: new Set() })
    expect(parseHiddenConsoles(null)).toEqual({})
  })

  test('refuses anything else whole', () => {
    expect(parseHiddenConsoles('nope')).toBeNull()
    expect(parseHiddenConsoles('[]')).toBeNull()
    expect(parseHiddenConsoles('{"steam":["x"]}')).toBeNull()
    expect(parseHiddenConsoles('{"psn":[1]}')).toBeNull()
    expect(parseHiddenConsoles(JSON.stringify({ psn: ['x'.repeat(65)] }))).toBeNull()
    expect(parseHiddenConsoles(JSON.stringify({ psn: Array(101).fill('x') }))).toBeNull()
  })
})
