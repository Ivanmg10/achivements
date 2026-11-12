import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import StreakCalendar from './StreakCalendar'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

// 2026-06-03 is a Wednesday.
function Picker({ start = '2026-06-03', end = '2026-06-16', counts = { '2026-06-04': 4 } as Record<string, number> }) {
  const [day, setDay] = useState(end)
  return <StreakCalendar start={start} end={end} today="2026-06-16" counts={counts} selected={day} onSelect={setDay} />
}

const group = () => screen.getByRole('group', { name: 'Day by day' })
const days = () => within(group()).getAllByRole('button')
const place = (name: RegExp) => {
  const { gridRow, gridColumn } = screen.getByRole('button', { name }).style
  return [Number(gridRow), Number(gridColumn)]
}

test('weeks are columns and weekdays rows: Monday on top, the first day in its own row', () => {
  render(<Picker />)
  expect(days()).toHaveLength(14)
  // Row 1 is the months, column 1 the weekday initials.
  expect(place(/Wednesday, June 3/)).toEqual([4, 2])
  expect(place(/Sunday, June 7/)).toEqual([8, 2])
  expect(place(/Monday, June 8/)).toEqual([2, 3])
  expect(place(/Tuesday, June 16/)).toEqual([3, 4])
  // Three weeks wide, whatever the length: seven rows.
  expect(group().style.gridTemplateColumns).toBe('auto repeat(3, minmax(1.75rem, 3.5rem))')
})

test('each day says its date and count; the last is picked and is today', () => {
  render(<Picker />)
  expect(screen.getByRole('button', { name: /June 4: 4 achievements/ })).toBeInTheDocument()
  const last = screen.getByRole('button', { name: /June 16/ })
  expect(last).toHaveAttribute('aria-pressed', 'true')
  expect(last).toHaveAttribute('aria-current', 'date')
  expect(last).toHaveClass('ring-2')
})

test('clicking a day picks it', () => {
  render(<Picker />)
  fireEvent.click(screen.getByRole('button', { name: /June 4/ }))
  expect(screen.getByRole('button', { name: /June 4/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /June 16/ })).toHaveAttribute('aria-pressed', 'false')
})

test('one tab stop; left and right move a week, up and down a day, Home and End to the ends, and focus follows', () => {
  render(<Picker />)
  expect(days().filter((b) => b.tabIndex === 0)).toHaveLength(1)
  const picked = () => screen.getByRole('button', { pressed: true })

  fireEvent.keyDown(picked(), { key: 'ArrowUp' })
  expect(picked()).toHaveAccessibleName(/June 15/)
  expect(picked()).toHaveFocus()

  fireEvent.keyDown(picked(), { key: 'ArrowLeft' })
  expect(picked()).toHaveAccessibleName(/June 8/)

  fireEvent.keyDown(picked(), { key: 'ArrowDown' })
  expect(picked()).toHaveAccessibleName(/June 9/)

  fireEvent.keyDown(picked(), { key: 'Home' })
  expect(picked()).toHaveAccessibleName(/June 3/)
  // Nothing before the first day.
  fireEvent.keyDown(picked(), { key: 'ArrowLeft' })
  fireEvent.keyDown(picked(), { key: 'ArrowUp' })
  expect(picked()).toHaveAccessibleName(/June 3/)

  fireEvent.keyDown(picked(), { key: 'ArrowRight' })
  expect(picked()).toHaveAccessibleName(/June 10/)
  fireEvent.keyDown(picked(), { key: 'End' })
  expect(picked()).toHaveAccessibleName(/June 16/)
  // Nothing after the last.
  fireEvent.keyDown(picked(), { key: 'ArrowRight' })
  expect(picked()).toHaveAccessibleName(/June 16/)
  expect(picked()).toHaveFocus()
})

test('a month with nothing in it keeps its grid: every day drawn, the month over the week it starts in', () => {
  render(<Picker start="2026-06-22" end="2026-07-12" counts={{}} />)
  expect(days()).toHaveLength(21)
  expect(days().every((b) => /0 achievements/.test(b.getAttribute('aria-label') ?? ''))).toBe(true)
  // June over the first week, July over the week of the 1st (the second).
  const months = [...group().querySelectorAll<HTMLElement>('span[aria-hidden="true"]')].filter((s) => s.style.gridRow === '1')
  expect(months.map((m) => [m.textContent, m.style.gridColumn])).toEqual([['Jun', '2'], ['Jul', '3']])
})

test('a 1st in the first week names that month only', () => {
  render(<Picker start="2026-06-29" end="2026-07-05" counts={{}} />)
  const months = [...group().querySelectorAll<HTMLElement>('span[aria-hidden="true"]')].filter((s) => s.style.gridRow === '1')
  expect(months.map((m) => m.textContent)).toEqual(['Jul'])
})
