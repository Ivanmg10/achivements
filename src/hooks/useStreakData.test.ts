import { renderHook } from '@testing-library/react'
import { useStreakData } from './useStreakData'
import { useActivityHeatmapYear } from './useActivityHeatmapYear'

jest.mock('./useActivityHeatmapYear', () => ({ useActivityHeatmapYear: jest.fn() }))

function ra(date: string, id: number) {
  return { AchievementID: id, Date: `${date} 12:00:00`, HardcoreMode: '0', Title: 'A', Description: '', BadgeName: 'b', Points: 5, GameID: 1, GameTitle: 'G', ConsoleName: 'SNES' }
}

function steam(date: string, id: number) {
  return { ...ra(date, id), Points: 0, BadgeName: '', Source: 'steam' as const, BadgeUrl: 'https://cdn/a.jpg', GameID: 620 }
}

function withYear(achievements: unknown[]) {
  ;(useActivityHeatmapYear as jest.Mock).mockReturnValue({
    achievements, isLoading: false, error: false, refetch: jest.fn(),
  })
  return renderHook(() => useStreakData()).result.current
}

test('a day spent only on Steam keeps the streak alive instead of breaking it', () => {
  const { bestStreak } = withYear([ra('2024-03-01', 1), steam('2024-03-02', 0), ra('2024-03-03', 2)])

  expect(bestStreak).toMatchObject({ start: '2024-03-01', end: '2024-03-03', days: 3 })
})

test('a Steam-only player has streaks at all', () => {
  const { bestStreak } = withYear([steam('2024-03-01', 0), steam('2024-03-02', 1)])

  expect(bestStreak).toMatchObject({ days: 2 })
})

test('no unlocks anywhere means no streaks', () => {
  const { streaks, activeStreak, bestStreak } = withYear([])

  expect(streaks).toEqual([])
  expect(activeStreak).toBeNull()
  expect(bestStreak).toBeNull()
})

test('the active streak is the one running up to today', () => {
  const today = new Date().toISOString().split('T')[0]
  const { activeStreak } = withYear([ra('2024-01-01', 1), steam(today, 0)])

  expect(activeStreak).toMatchObject({ end: today })
})
