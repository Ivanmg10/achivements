import { classifySteamGame, raDateToIso, mergeRecentFeeds, formatPlaytime } from './steamFeed'
import { toSteamGameProgress } from './steamMappers'
import type { RecentlyPlayedGame } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'

function steam(overrides: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return {
    ...toSteamGameProgress({ appid: 1, name: 'S', playtime_forever: 60, has_community_visible_stats: true }),
    ...overrides,
  }
}

function ra(id: number, lastPlayed: string): RecentlyPlayedGame {
  return {
    GameID: id, Title: `RA ${id}`, ImageIcon: '', ConsoleName: 'SNES', LastPlayed: lastPlayed,
    NumPossibleAchievements: 10, PossibleScore: 100, NumAchieved: 1, ScoreAchieved: 10,
    NumAchievedHardcore: 0, ScoreAchievedHardcore: 0,
  }
}

describe('classifySteamGame', () => {
  const loaded = { achievementsLoaded: true, maxPossible: 10 }

  test('never launched is want to play, whatever the counts say', () => {
    expect(classifySteamGame(steam({ playtimeForever: 0 }))).toBe('wantToPlay')
    expect(classifySteamGame(steam({ playtimeForever: 0, hasStats: false }))).toBe('wantToPlay')
  })

  test('every achievement earned is completed', () => {
    expect(classifySteamGame(steam({ ...loaded, numAwarded: 10 }))).toBe('completed')
  })

  test('some but not all earned is playing', () => {
    expect(classifySteamGame(steam({ ...loaded, numAwarded: 3 }))).toBe('playing')
  })

  test('played with nothing earned yet is left out — matches RA, which needs PctWon > 0', () => {
    expect(classifySteamGame(steam({ ...loaded, numAwarded: 0 }))).toBeNull()
  })

  test('played but counts not loaded is left out rather than guessed', () => {
    expect(classifySteamGame(steam({ achievementsLoaded: false }))).toBeNull()
  })

  test('played with no achievements at all is left out', () => {
    expect(classifySteamGame(steam({ achievementsLoaded: true, maxPossible: 0 }))).toBeNull()
  })
})

describe('raDateToIso', () => {
  test('reads RA dates as UTC', () => {
    expect(raDateToIso('2024-01-15 20:30:00')).toBe('2024-01-15T20:30:00.000Z')
  })

  test('returns null for missing or garbage input', () => {
    expect(raDateToIso(null)).toBeNull()
    expect(raDateToIso(undefined)).toBeNull()
    expect(raDateToIso('')).toBeNull()
    expect(raDateToIso('not a date')).toBeNull()
  })
})

describe('mergeRecentFeeds', () => {
  test('interleaves both platforms newest first', () => {
    const merged = mergeRecentFeeds(
      [ra(1, '2024-01-10 00:00:00'), ra(2, '2024-01-01 00:00:00')],
      [steam({ id: 9, lastPlayed: '2024-01-05T00:00:00.000Z' })],
      10,
    )
    expect(merged.map((i) => i.key)).toEqual(['ra:1', 'steam:9', 'ra:2'])
  })

  test('keeps RA and Steam items with the same numeric id apart', () => {
    const merged = mergeRecentFeeds([ra(730, '2024-01-01 00:00:00')], [steam({ id: 730, lastPlayed: '2024-01-02T00:00:00.000Z' })], 10)
    expect(merged.map((i) => i.key)).toEqual(['steam:730', 'ra:730'])
  })

  test('puts undated entries last and keeps their relative order', () => {
    const merged = mergeRecentFeeds(
      [ra(1, 'bad'), ra(2, '2024-01-01 00:00:00')],
      [steam({ id: 9, lastPlayed: null })],
      10,
    )
    expect(merged.map((i) => i.key)).toEqual(['ra:2', 'ra:1', 'steam:9'])
  })

  test('applies the limit after sorting', () => {
    const merged = mergeRecentFeeds(
      [ra(1, '2024-01-01 00:00:00')],
      [steam({ id: 9, lastPlayed: '2024-06-01T00:00:00.000Z' }), steam({ id: 8, lastPlayed: '2024-05-01T00:00:00.000Z' })],
      2,
    )
    expect(merged.map((i) => i.key)).toEqual(['steam:9', 'steam:8'])
  })

  test('carries the source so callers can branch on it', () => {
    const [item] = mergeRecentFeeds([], [steam({ id: 9 })], 5)
    expect(item.source).toBe('steam')
    expect(item.game).toMatchObject({ id: 9 })
  })

  test('handles two empty feeds', () => {
    expect(mergeRecentFeeds([], [], 5)).toEqual([])
  })
})

describe('formatPlaytime', () => {
  const units = { minutes: 'min', hours: 'h' }

  test('shows minutes under an hour', () => {
    expect(formatPlaytime(0, units)).toBe('0 min')
    expect(formatPlaytime(45, units)).toBe('45 min')
  })

  test('shows one decimal under ten hours', () => {
    expect(formatPlaytime(90, units, 'en')).toBe('1.5 h')
  })

  test('rounds to whole hours from ten up', () => {
    expect(formatPlaytime(51234, units, 'en')).toBe('854 h')
  })

  test('formats the number for the app language, not the machine locale', () => {
    expect(formatPlaytime(90, units, 'es')).toBe('1,5 h')
    expect(formatPlaytime(123456, units, 'de')).toBe('2.058 h')
  })

  test('never goes negative', () => {
    expect(formatPlaytime(-5, units)).toBe('0 min')
  })

  test('uses the units it is given', () => {
    expect(formatPlaytime(120, { minutes: 'мин', hours: 'ч' })).toBe('2 ч')
  })
})
