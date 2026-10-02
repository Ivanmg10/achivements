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

describe('month labels', () => {
  // A year's worth, so every month in the window has unlocks to date it.
  const wholeWindow = Array.from({ length: 200 }, (_, i) => unlock(today(i), `A${i}`))

  function labels() {
    return Array.from(document.querySelectorAll('span'))
      .map((el) => ({ text: el.textContent ?? '', left: parseFloat((el as HTMLElement).style.left) }))
      .filter((l) => !Number.isNaN(l.left))
  }

  test('each month is placed over the column it starts in, free of the grid cells', () => {
    render(<MainPageHeatmap achievements={wholeWindow} />)
    const placed = labels()

    expect(placed.length).toBeGreaterThan(1)
    // Inside a cell the name would be clipped to the cell's width; these are not.
    for (const { left } of placed) expect(left % (CELL + 3)).toBe(0)
  })

  test('two months never print on top of each other', () => {
    render(<MainPageHeatmap achievements={wholeWindow} />)
    const lefts = labels().map((l) => l.left).sort((a, b) => a - b)

    for (let i = 1; i < lefts.length; i++) {
      expect(lefts[i] - lefts[i - 1]).toBeGreaterThanOrEqual(3 * (CELL + 3) - 1)
    }
  })

  test('a month too narrow to name is left unnamed rather than overlapping', () => {
    ;(useHeatmapGrid as jest.Mock).mockReturnValue({ weeks: 5, cell: CELL, days: 33 })
    render(<MainPageHeatmap achievements={wholeWindow} />)

    // Five columns can hold at most one month name with room to read it.
    expect(labels().length).toBeLessThanOrEqual(2)
  })
})

describe('the scale and the summary', () => {
  test('shades against the user’s own busiest day: the busiest is the darkest', () => {
    const busy = Array.from({ length: 20 }, (_, i) => unlock(today(1), `a${i}`))
    render(<MainPageHeatmap achievements={[...busy, unlock(today(3), 'one')]} />)
    const busiest = document.querySelector(`[data-date="${today(1)}"]`) as HTMLElement
    const quiet = document.querySelector(`[data-date="${today(3)}"]`) as HTMLElement
    expect(busiest.style.backgroundColor).toBe('rgb(var(--accent) / 0.95)')
    expect(quiet.style.backgroundColor).not.toBe(busiest.style.backgroundColor)
    expect(quiet.style.backgroundColor).not.toBe('rgb(var(--bg-header))')
  })

  test('marks today', () => {
    render(<MainPageHeatmap achievements={[]} />)
    expect(document.querySelector(`[data-date="${today(0)}"]`)).toHaveClass('ring-1')
  })

  test('sums up active days and the best day, and labels the legend in the app’s language', () => {
    render(<MainPageHeatmap achievements={[unlock(today(1), 'a'), unlock(today(1), 'b'), unlock(today(2), 'c')]} />)
    expect(screen.getByText(new RegExp(en.cards.activeDays.replace('{n}', '2')))).toHaveTextContent(en.lineChart.bestDay.replace('{n}', '2'))
    expect(screen.getByText(en.cards.heatLess)).toBeInTheDocument()
    expect(screen.getByText(en.cards.heatMore)).toBeInTheDocument()
  })
})
