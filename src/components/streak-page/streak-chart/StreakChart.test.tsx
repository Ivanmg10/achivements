import { render, screen, fireEvent } from '@testing-library/react'
import StreakChart from './StreakChart'
import type { Streak } from '@/types/types'
import { streakTier } from '@/utils/streakTier'

const streak = (start: string, end: string, days: number) => ({ start, end, days, achievements: [] }) as unknown as Streak
const long = streak('2026-08-01', '2026-09-02', 33)
const short = streak('2026-05-01', '2026-05-07', 7)

function setup(selected: Streak | null = null) {
  const onSelect = jest.fn()
  const { container } = render(<StreakChart streaks={[long, short]} selectedStreak={selected} activeStreak={null} avgStreak={20} onSelect={onSelect} />)
  return { onSelect, container }
}

test('with nothing picked no row is pressed', () => {
  setup()
  expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(2)
})

test('each streak has the colour of its own tier', () => {
  const { container } = setup()
  const bars = [...container.querySelectorAll<HTMLElement>('.enter-grow-x')].map((bar) => bar.style.backgroundColor.replace(/\s|,/g, ''))
  expect(bars).toEqual([long, short].map((s) => `rgb(${streakTier(s.days).color})`.replace(/\s/g, '')))
})

test('a row says it is picked, and tells the page either way', () => {
  const { onSelect } = setup(short)
  const pressed = screen.getByRole('button', { pressed: true })
  expect(pressed).toHaveClass('ring-1')
  fireEvent.click(pressed)
  expect(onSelect).toHaveBeenCalledWith(short)
})
