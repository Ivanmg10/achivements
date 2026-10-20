import { activityJournal, compareMonths, localDay, playHabits, unlockTime } from './activityInsights'
import type { RecentAchievement } from '@/types/types'

// Every date here is built in local time and written out as UTC, as the feed sends them,
// so the tests hold in any time zone.
const utc = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19)
const unlock = (local: Date, over: Partial<RecentAchievement> = {}) =>
  ({ Date: utc(local), GameID: 1, GameTitle: 'Game', ConsoleName: 'PS4', Points: 0, ...over }) as RecentAchievement

test('an unlock is read as UTC and counted in local time', () => {
  const local = new Date(2026, 9, 17, 20, 15)
  expect(unlockTime(unlock(local)).getTime()).toBe(local.getTime())
  expect(localDay(local)).toBe('2026-10-17')
})

describe('playHabits', () => {
  test('counts by weekday (Monday first) and by hour, and finds the busiest day and three hours', () => {
    // 2026-10-18 is a Sunday.
    const sunday = (h: number) => unlock(new Date(2026, 9, 18, h))
    const habits = playHabits([sunday(18), sunday(19), sunday(19), sunday(20), unlock(new Date(2026, 9, 12, 9))])
    expect(habits.total).toBe(5)
    expect(habits.peak).toEqual({ day: 6, fromHour: 18 })
    expect(habits.byDay).toEqual([1, 0, 0, 0, 0, 0, 4])
    expect(habits.byHour[19]).toBe(2)
    expect(habits.byHour.reduce((n, c) => n + c, 0)).toBe(5)
  })

  test('nothing unlocked, no peak', () => {
    expect(playHabits([])).toMatchObject({ total: 0, peak: null })
  })
})

describe('compareMonths', () => {
  const now = new Date(2026, 9, 17, 12)

  test('this month so far against the same days of last month', () => {
    const list = [
      unlock(new Date(2026, 9, 2, 10), { GameID: 1 }),
      unlock(new Date(2026, 9, 2, 11), { GameID: 2 }),
      unlock(new Date(2026, 9, 16, 22), { GameID: 2 }),
      unlock(new Date(2026, 8, 5, 10), { GameID: 3 }),
      // The 20th of September is past the 17th: not compared.
      unlock(new Date(2026, 8, 20, 10), { GameID: 4 }),
    ]
    const c = compareMonths(list, now)
    expect(c.current).toEqual({ unlocks: 3, games: 2, days: 2 })
    expect(c.previous).toEqual({ unlocks: 1, games: 1, days: 1 })
    expect(c.throughDay).toBe(17)
    expect(c.previousMonth).toEqual(new Date(2026, 8, 1))
  })

  test('an RA game and a Steam app with the same number are two games', () => {
    const c = compareMonths([unlock(new Date(2026, 9, 3), { GameID: 9 }), unlock(new Date(2026, 9, 3), { GameID: 9, Source: 'steam' })], now)
    expect(c.current.games).toBe(2)
  })

  test('on the 31st, a 30-day month is compared whole', () => {
    expect(compareMonths([], new Date(2026, 9, 31, 12)).throughDay).toBe(30)
  })
})

describe('activityJournal', () => {
  test('the last days with unlocks, newest first, games busiest first', () => {
    const days = activityJournal(
      [
        unlock(new Date(2026, 9, 15, 10), { GameID: 1, GameTitle: 'Old' }),
        unlock(new Date(2026, 9, 17, 9), { GameID: 2, GameTitle: 'BO2', Source: 'psn' }),
        unlock(new Date(2026, 9, 17, 10), { GameID: 3, GameTitle: 'Colosseum' }),
        unlock(new Date(2026, 9, 17, 11), { GameID: 3, GameTitle: 'Colosseum' }),
        unlock(new Date(2026, 9, 16, 10), { GameID: 2, GameTitle: 'BO2', Source: 'psn' }),
      ],
      2,
    )
    expect(days.map((d) => d.day)).toEqual(['2026-10-17', '2026-10-16'])
    expect(days[0].total).toBe(3)
    expect(days[0].games.map((g) => [g.title, g.count, g.source])).toEqual([['Colosseum', 2, 'ra'], ['BO2', 1, 'psn']])
  })
})
