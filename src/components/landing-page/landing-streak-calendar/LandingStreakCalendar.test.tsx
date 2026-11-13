import { fireEvent, render, screen } from '@testing-library/react'
import LandingStreakCalendar from './LandingStreakCalendar'
import { SAMPLE_STREAKS, streakCalendarDays } from '@/components/landing-page/landingSamples'
import { en } from '@/translations/en'

const live = SAMPLE_STREAKS[0]
const days = streakCalendarDays(live, live.end)
const draw = (picked = live.end, onPick = jest.fn()) => render(<LandingStreakCalendar days={days} ink="rgb(251 146 60)" picked={picked} onPick={onPick} />)

test('ten weeks; each past day a button with its count, the streak filled in its colour, the rest of the week empty', () => {
  const { container } = draw()
  const buttons = screen.getAllByRole('button')
  expect(buttons).toHaveLength(days.filter((d) => d.count !== null).length)
  const first = days.find((d) => d.streak)!
  const cell = container.querySelector(`[data-day="${first.day}"]`) as HTMLElement
  expect(cell).toHaveTextContent(String(first.count))
  expect(cell.style.backgroundColor).toContain('color-mix')
  expect(screen.getByText(en.landing.streakLegend)).toBeInTheDocument()
})

test('one tab stop, the picked day; the arrows move a day or a week', () => {
  const onPick = jest.fn()
  const { container } = draw(live.end, onPick)
  const today = container.querySelector(`[data-day="${live.end}"]`) as HTMLElement
  expect(today).toHaveAttribute('aria-pressed', 'true')
  expect(today).toHaveAttribute('tabindex', '0')
  fireEvent.keyDown(today, { key: 'ArrowUp' })
  expect(onPick).toHaveBeenLastCalledWith(days[days.findIndex((d) => d.day === live.end) - 1].day)
  fireEvent.keyDown(today, { key: 'ArrowLeft' })
  expect(onPick).toHaveBeenLastCalledWith(days[days.findIndex((d) => d.day === live.end) - 7].day)
})

test('the day the last streak broke is in the calendar, with nothing', () => {
  const broke = days[days.findIndex((d) => d.streak) - 1]
  expect(broke).toMatchObject({ count: 0, streak: false })
})
