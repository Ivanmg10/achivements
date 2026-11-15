import { render, screen, fireEvent } from '@testing-library/react'
import StreakYearHeatmap from './StreakYearHeatmap'
import type { Streak } from '@/types/types'

const streak = (start: string, end: string) => ({ start, end, days: 3, achievements: [] }) as unknown as Streak
const picked = streak('2026-10-20', '2026-10-22')
const other = streak('2026-09-01', '2026-09-03')
const byDay = { '2026-10-20': 2, '2026-10-21': 4, '2026-10-22': 1, '2026-09-01': 4, '2026-09-02': 1, '2026-09-03': 2 }

function setup(selected: Streak | null = picked) {
  const onSelect = jest.fn()
  const { container } = render(<StreakYearHeatmap byDay={byDay} streaks={[picked, other]} selected={selected} today="2026-11-01" onSelect={onSelect} />)
  return { onSelect, container }
}

test('only the picked streak has the accent; the rest of the year is grey', () => {
  setup()
  const pressed = screen.getAllByRole('button', { pressed: true })
  const unpressed = screen.getAllByRole('button', { pressed: false })
  expect(pressed).toHaveLength(3)
  expect(unpressed).toHaveLength(3)
  for (const day of pressed) expect(day.style.backgroundColor).toContain('--accent')
  for (const day of unpressed) expect(day.style.backgroundColor).toContain('--ink')
})

test('with nothing picked the whole year is in the accent, and no day is pressed', () => {
  setup(null)
  const days = screen.getAllByRole('button', { pressed: false })
  expect(days).toHaveLength(6)
  for (const day of days) expect(day.style.backgroundColor).toContain('--accent')
})

test('a rail spans the weeks of the picked streak, and none shows without one', () => {
  const { container } = setup()
  expect(container.querySelector('.bg-accent')).toBeInTheDocument()
  const none = setup(null)
  expect(none.container.querySelector('.bg-accent')).toBeNull()
})

test('a streak older than the grid draws no rail', () => {
  const { container } = setup(streak('2020-01-01', '2020-01-03'))
  expect(container.querySelector('.bg-accent')).toBeNull()
})

test('picking a played day opens its streak', () => {
  const { onSelect } = setup()
  fireEvent.click(screen.getAllByRole('button', { pressed: false })[0])
  expect(onSelect).toHaveBeenCalledWith(other)
})
