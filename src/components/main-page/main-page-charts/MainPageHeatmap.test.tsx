import { render, screen, fireEvent } from '@testing-library/react'
import MainPageHeatmap from './MainPageHeatmap'
import { useHeatmapGrid } from '@/hooks/useHeatmapGrid'
import { RecentAchievement } from '@/types/types'
import { en } from '@/translations/en'

jest.mock('@/hooks/useHeatmapGrid', () => ({
  ...jest.requireActual('@/hooks/useHeatmapGrid'),
  useHeatmapGrid: jest.fn(),
}))

// The card is 10 weeks wide here; measuring it is the hook's own test.
const WEEKS = 10
const CELL = 24
const DAYS = 68

function today(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().split('T')[0]
}

function unlock(date: string, title: string): RecentAchievement {
  return {
    AchievementID: 1, Date: `${date} 12:00:00`, HardcoreMode: '0', Title: title,
    Description: '', BadgeName: 'b', Points: 5, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES',
  }
}

const cells = () => document.querySelectorAll('[data-count]')

beforeEach(() => {
  ;(useHeatmapGrid as jest.Mock).mockReturnValue({ weeks: WEEKS, cell: CELL, days: DAYS })
})

test('draws a cell for every day of every column it was measured for', () => {
  render(<MainPageHeatmap achievements={[]} />)
  expect(cells()).toHaveLength(WEEKS * 7)
})

test('says how many days it is showing, which the measurement decides', () => {
  render(<MainPageHeatmap achievements={[]} />)
  expect(
    screen.getByText(new RegExp(en.cards.activityLastDays.replace('{n}', String(DAYS)), 'i')),
  ).toBeInTheDocument()
})

test('loading draws the same grid, so nothing moves when it fills', () => {
  const { rerender } = render(<MainPageHeatmap achievements={[]} isLoading />)
  const loading = Array.from(cells()).map((c) => (c as HTMLElement).style.backgroundColor)
  expect(loading).toHaveLength(WEEKS * 7)
  // Every cell is an empty one — no invented activity while it loads.
  expect(new Set(loading).size).toBe(1)
  expect(screen.getByText('—')).toBeInTheDocument()

  rerender(<MainPageHeatmap achievements={[unlock(today(), 'Win')]} />)
  expect(cells()).toHaveLength(loading.length)
})

test('counts the unlocks it was given', () => {
  render(<MainPageHeatmap achievements={[unlock(today(), 'A'), unlock(today(1), 'B')]} />)
  expect(screen.getByText('2')).toBeInTheDocument()
})

test('a day with unlocks opens that day, an empty one does nothing', () => {
  render(<MainPageHeatmap achievements={[unlock(today(), 'Win')]} />)

  const withUnlocks = document.querySelector(`[data-date="${today()}"]`) as HTMLElement
  const empty = document.querySelector(`[data-date="${today(3)}"]`) as HTMLElement

  fireEvent.click(empty)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  fireEvent.click(withUnlocks)
  expect(screen.getByText('Win')).toBeInTheDocument()
})

test('draws nothing at all until the card has been measured', () => {
  ;(useHeatmapGrid as jest.Mock).mockReturnValue({ weeks: 0, cell: 0, days: 0 })
  render(<MainPageHeatmap achievements={[unlock(today(), 'Win')]} />)
  expect(cells()).toHaveLength(0)
})
