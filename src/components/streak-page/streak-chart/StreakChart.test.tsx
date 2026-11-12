import { cleanup, render, screen, fireEvent } from '@testing-library/react'
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

test('grey but the one shown, in the colour of its tier', () => {
  const colours = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.enter-grow-x')].map((bar) => bar.style.backgroundColor.replace(/\s|,/g, ''))
  const rgb = (days: number) => `rgb(${streakTier(days).color})`.replace(/\s/g, '')
  const { container } = setup()
  expect(colours(container)).toEqual([rgb(0), rgb(0)])
  cleanup()
  const picked = setup(short)
  expect(colours(picked.container)).toEqual([rgb(0), rgb(short.days)])
})

test('a row says it is picked, and tells the page either way', () => {
  const { onSelect } = setup(short)
  const pressed = screen.getByRole('button', { pressed: true })
  expect(pressed).toHaveClass('ring-1')
  fireEvent.click(pressed)
  expect(onSelect).toHaveBeenCalledWith(short)
})

test('the head says how many and the average as two facts', () => {
  setup()
  const head = screen.getByRole('heading').parentElement!
  expect(head).toHaveTextContent(/2 in all.*on average, 20.0 days/)
  // Joined by the mark, never a hand-made dot.
  expect(head).not.toHaveTextContent('·')
})
