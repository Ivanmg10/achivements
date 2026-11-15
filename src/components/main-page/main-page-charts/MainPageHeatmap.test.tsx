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
  ;(useHeatmapGrid as jest.Mock).mockReturnValue({ weeks: WEEKS, cell: CELL, cellWidth: CELL, days: DAYS })
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
  const { container, rerender } = render(<MainPageHeatmap achievements={[]} isLoading />)
  const loading = Array.from(cells()).map((c) => (c as HTMLElement).style.backgroundColor)
  expect(loading).toHaveLength(WEEKS * 7)
  // Every cell is an empty one — no invented activity while it loads.
  expect(new Set(loading).size).toBe(1)
  expect(container.querySelector('p .bg-skeleton')).toBeInTheDocument()

  rerender(<MainPageHeatmap achievements={[unlock(today(), 'Win')]} />)
  expect(cells()).toHaveLength(loading.length)
})

test('counts the unlocks it was given, with the word for them', () => {
  const { rerender } = render(<MainPageHeatmap achievements={[unlock(today(), 'A'), unlock(today(1), 'B')]} />)
  expect(screen.getByText('2 achievements')).toBeInTheDocument()
  rerender(<MainPageHeatmap achievements={[unlock(today(), 'A')]} />)
  expect(screen.getByText('1 achievement')).toBeInTheDocument()
})

test('a day with unlocks opens that day, an empty one does nothing', async () => {
  render(<MainPageHeatmap achievements={[unlock(today(), 'Win')]} />)

  const withUnlocks = document.querySelector(`[data-date="${today()}"]`) as HTMLElement
  const empty = document.querySelector(`[data-date="${today(3)}"]`) as HTMLElement

  fireEvent.click(empty)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  fireEvent.click(withUnlocks)
  expect(await screen.findByText('Win')).toBeInTheDocument()
})

test('draws nothing at all until the card has been measured', () => {
  ;(useHeatmapGrid as jest.Mock).mockReturnValue({ weeks: 0, cell: 0, cellWidth: 0, days: 0 })
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
    // The last one may instead be held back from the right edge (early in a
    // month it starts in the last column), so it is only checked to come last.
    const last = placed[placed.length - 1]
    for (const { left } of placed.slice(0, -1)) expect(left % (CELL + 3)).toBe(0)
    expect(last.left).toBeGreaterThan(placed[placed.length - 2].left)
  })

  test('wider cells move the columns and the months with them', () => {
    ;(useHeatmapGrid as jest.Mock).mockReturnValue({ weeks: WEEKS, cell: CELL, cellWidth: 30, days: DAYS })
    render(<MainPageHeatmap achievements={wholeWindow} />)
    const placed = labels()
    for (const { left } of placed.slice(0, -1)) expect(left % 33).toBe(0)
    expect(document.querySelector<HTMLElement>('[data-count]')?.parentElement?.style.gridTemplateColumns).toContain('30px')
  })

  test('two months never print on top of each other', () => {
    render(<MainPageHeatmap achievements={wholeWindow} />)
    const lefts = labels().map((l) => l.left).sort((a, b) => a - b)

    for (let i = 1; i < lefts.length; i++) {
      expect(lefts[i] - lefts[i - 1]).toBeGreaterThanOrEqual(3 * (CELL + 3) - 1)
    }
  })

  test('a month too narrow to name is left unnamed rather than overlapping', () => {
    ;(useHeatmapGrid as jest.Mock).mockReturnValue({ weeks: 5, cell: CELL, cellWidth: CELL, days: 33 })
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
    expect(busiest.style.backgroundColor).toBe('color-mix(in oklab, rgb(var(--accent)) 78%, rgb(var(--ink)))')
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

test('while loading, the empty grid carries the wave, each cell placed on the diagonal', () => {
  render(<MainPageHeatmap achievements={[]} isLoading />)
  const all = cells()
  expect(all).toHaveLength(WEEKS * 7)
  const cell = all[8] as HTMLElement // week 1, day 1
  expect(cell).toHaveClass('heat-loading')
  expect(cell).not.toHaveClass('heat-cell')
  expect(cell.style.getPropertyValue('--col')).toBe('1')
  expect(cell.style.getPropertyValue('--row')).toBe('1')
})

describe('the days are reachable without a mouse (F3)', () => {
  const dayButtons = () => screen.getAllByRole('button').filter((b) => b.hasAttribute('data-date'))

  test('a day with unlocks is a button named by its date and count; an empty one is only paint', () => {
    render(<MainPageHeatmap achievements={[unlock(today(), 'Win'), unlock(today(), 'Win 2'), unlock(today(2), 'One')]} />)
    expect(dayButtons()).toHaveLength(2)
    const busy = document.querySelector(`[data-date="${today()}"]`) as HTMLElement
    expect(busy.tagName).toBe('BUTTON')
    expect(busy).toHaveAttribute('aria-label', expect.stringMatching(/: 2 achievements$/))
    expect(document.querySelector(`[data-date="${today(2)}"]`)).toHaveAttribute('aria-label', expect.stringMatching(/: 1 achievement$/))
    const empty = document.querySelector(`[data-date="${today(5)}"]`) as HTMLElement
    expect(empty.tagName).toBe('DIV')
    expect(empty).toHaveAttribute('aria-hidden', 'true')
  })

  test('Enter on a focused day opens it', async () => {
    render(<MainPageHeatmap achievements={[unlock(today(), 'Win')]} />)
    const day = dayButtons()[0]
    day.focus()
    fireEvent.click(day)
    expect(await screen.findByText('Win')).toBeInTheDocument()
  })

  test('arrows, Home and End move between the days with unlocks in calendar order', () => {
    render(<MainPageHeatmap achievements={[unlock(today(), 'a'), unlock(today(2), 'b'), unlock(today(4), 'c')]} />)
    const [oldest, middle, newest] = dayButtons()
    oldest.focus()
    fireEvent.keyDown(oldest, { key: 'ArrowRight' })
    expect(middle).toHaveFocus()
    fireEvent.keyDown(middle, { key: 'ArrowDown' })
    expect(newest).toHaveFocus()
    fireEvent.keyDown(newest, { key: 'ArrowRight' })
    expect(newest).toHaveFocus()
    fireEvent.keyDown(newest, { key: 'ArrowLeft' })
    expect(middle).toHaveFocus()
    fireEvent.keyDown(middle, { key: 'Home' })
    expect(oldest).toHaveFocus()
    fireEvent.keyDown(oldest, { key: 'End' })
    expect(newest).toHaveFocus()
  })

  test('focusing a day shows its tooltip, leaving hides it', () => {
    render(<MainPageHeatmap achievements={[unlock(today(), 'Win')]} />)
    const day = dayButtons()[0]
    fireEvent.focus(day)
    const tooltip = document.querySelector('[aria-hidden="true"].pointer-events-none') as HTMLElement
    expect(tooltip.style.display).toBe('block')
    expect(tooltip.textContent).toMatch(/1 achievement/i)
    fireEvent.blur(day)
    expect(tooltip.style.display).toBe('none')
  })
})
