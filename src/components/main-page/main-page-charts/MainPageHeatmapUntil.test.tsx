import { render, screen } from '@testing-library/react'
import MainPageHeatmap from './MainPageHeatmap'
import { useHeatmapGrid } from '@/hooks/useHeatmapGrid'
import { groupByDays } from '@/utils/utils'
import type { RecentAchievement } from '@/types/types'

jest.mock('@/hooks/useHeatmapGrid', () => ({
  ...jest.requireActual('@/hooks/useHeatmapGrid'),
  useHeatmapGrid: jest.fn(),
}))

const WEEKS = 10

const unlock = (date: string): RecentAchievement => ({
  AchievementID: 1, Date: `${date} 12:00:00`, HardcoreMode: '0', Title: 'T', Description: '', BadgeName: 'b', Points: 5, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES',
})

beforeEach(() => {
  ;(useHeatmapGrid as jest.Mock).mockReturnValue({ weeks: WEEKS, cell: 24, cellWidth: 24, days: 68 })
})

describe('a calendar that ends before today', () => {
  // A Wednesday: the last column is the week of that day, not of today.
  const until = new Date(2024, 5, 12, 12)

  test('shows the days up to that one, with the unlocks of that time', () => {
    render(<MainPageHeatmap achievements={[unlock('2024-06-10'), unlock('2024-06-10'), unlock('2024-06-12')]} until={until} title="Activity in this game" />)
    const cells = [...document.querySelectorAll('[data-date]')] as HTMLElement[]
    const last = cells.filter((c) => c.dataset.date).at(-1)!
    expect(last.dataset.date).toBe('2024-06-12')
    expect(cells.find((c) => c.dataset.date === '2024-06-10')!.dataset.count).toBe('2')
  })

  test('fills the weeks it was measured for, counting back from that weekday', () => {
    render(<MainPageHeatmap achievements={[]} until={until} />)
    // 10 weeks of 7 days, less the three days of the last week that come after a Wednesday.
    expect(document.querySelectorAll('[data-date]')).toHaveLength(WEEKS * 7 - 3)
  })

  test('has the title it was given, and says it to assistive technology', () => {
    render(<MainPageHeatmap achievements={[unlock('2024-06-12')]} until={until} title="Activity in this game" />)
    expect(screen.getAllByText('Activity in this game').length).toBeGreaterThan(0)
    expect(screen.getByRole('img', { name: /^Activity in this game: 1/ })).toBeInTheDocument()
  })
})

describe('groupByDays', () => {
  test('counts back from the day given, not from today', () => {
    const days = groupByDays([unlock('2024-06-11')], 3, new Date(2024, 5, 12, 12))
    expect(days.map((d) => d.date)).toEqual(['2024-06-10', '2024-06-11', '2024-06-12'])
    expect(days.map((d) => d.count)).toEqual([0, 1, 0])
  })
})
