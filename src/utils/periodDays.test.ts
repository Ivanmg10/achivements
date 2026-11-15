import { allRa, dayOf, groupDays, groupGames } from './periodDays'
import type { RecentAchievement } from '@/types/types'

let id = 0
function ach(date: string, over: Partial<RecentAchievement> = {}): RecentAchievement {
  return {
    Date: date, HardcoreMode: '1', AchievementID: ++id, Title: `A${id}`, Description: '', BadgeName: '1',
    Points: 10, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES', GameIcon: '/Images/z.png', ...over,
  }
}

test('dayOf reads the calendar day of an unlock', () => {
  expect(dayOf(ach('2024-01-15 20:30:00'))).toBe('2024-01-15')
})

test('days come newest first, with their count and RA points', () => {
  const days = groupDays([ach('2024-01-14 10:00:00'), ach('2024-01-16 09:00:00', { Points: 5 }), ach('2024-01-16 11:00:00')])
  expect(days.map((d) => [d.date, d.count, d.points, d.hasPoints])).toEqual([
    ['2024-01-16', 2, 15, true],
    ['2024-01-14', 1, 10, true],
  ])
})

test('a day that mixes platforms has no points to show', () => {
  const [day] = groupDays([ach('2024-01-16 09:00:00'), ach('2024-01-16 10:00:00', { Source: 'steam', GameID: 620, Points: 0 })])
  expect(day.hasPoints).toBe(false)
  expect(allRa([ach('2024-01-16 09:00:00')])).toBe(true)
})

test('a day groups its unlocks by game, once each, with the latest game and unlock first', () => {
  const [day] = groupDays([
    ach('2024-01-16 08:00:00', { GameID: 1, GameTitle: 'Zelda', Title: 'old zelda' }),
    ach('2024-01-16 12:00:00', { GameID: 2, GameTitle: 'Mario', Title: 'mario' }),
    ach('2024-01-16 10:00:00', { GameID: 1, GameTitle: 'Zelda', Title: 'new zelda' }),
  ])
  expect(day.games.map((g) => g.title)).toEqual(['Mario', 'Zelda'])
  expect(day.games[1].achievements.map((a) => a.Title)).toEqual(['new zelda', 'old zelda'])
})

test('RA and Steam ids that overlap stay two games, and a game carries its cover and console', () => {
  const games = groupGames([
    ach('2024-01-16 08:00:00', { GameID: 620 }),
    ach('2024-01-16 09:00:00', { GameID: 620, Source: 'steam', GameIconUrl: 'https://cdn/p.jpg', ConsoleName: 'Steam' }),
  ])
  expect(games).toHaveLength(2)
  const steam = games.find((g) => g.source === 'steam')!
  expect(steam).toMatchObject({ key: 'steam:620', image: 'https://cdn/p.jpg', console: '' })
  expect(games.find((g) => g.source === 'ra')).toMatchObject({ console: 'SNES', image: 'https://retroachievements.org/Images/z.png' })
})

test('nothing in, nothing out', () => {
  expect(groupDays([])).toEqual([])
})
