import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import StreakCalendar from './StreakCalendar'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

// 2026-06-03 is a Wednesday.
function Picker({ start = '2026-06-03', end = '2026-06-16', counts = { '2026-06-04': 4 } as Record<string, number> }) {
  const [day, setDay] = useState(end)
  return <StreakCalendar start={start} end={end} today="2026-06-16" counts={counts} selected={day} onSelect={setDay} />
}

const days = () => within(screen.getByRole('group', { name: 'Day by day' })).getAllByRole('button')

test('one button per day, Monday first: the first day sits under its own weekday', () => {
  render(<Picker />)
  const grid = screen.getByRole('group', { name: 'Day by day' })
  expect(days()).toHaveLength(14)
  // Monday and Tuesday are blank before Wednesday the 3rd.
  expect(grid.children[0].tagName).toBe('SPAN')
  expect(grid.children[1].tagName).toBe('SPAN')
  expect(grid.children[2]).toHaveAccessibleName(/Wednesday, June 3: 0 achievements/)
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

test('one tab stop; the arrows move a day or a week, Home and End to the ends, and focus follows', () => {
  render(<Picker />)
  expect(days().filter((b) => b.tabIndex === 0)).toHaveLength(1)
  const picked = () => screen.getByRole('button', { pressed: true })

  fireEvent.keyDown(picked(), { key: 'ArrowLeft' })
  expect(picked()).toHaveAccessibleName(/June 15/)
  expect(picked()).toHaveFocus()

  fireEvent.keyDown(picked(), { key: 'ArrowUp' })
  expect(picked()).toHaveAccessibleName(/June 8/)

  fireEvent.keyDown(picked(), { key: 'Home' })
  expect(picked()).toHaveAccessibleName(/June 3/)
  // Nothing before the first day.
  fireEvent.keyDown(picked(), { key: 'ArrowLeft' })
  expect(picked()).toHaveAccessibleName(/June 3/)

  fireEvent.keyDown(picked(), { key: 'ArrowDown' })
  expect(picked()).toHaveAccessibleName(/June 10/)
  fireEvent.keyDown(picked(), { key: 'End' })
  expect(picked()).toHaveAccessibleName(/June 16/)
  expect(picked()).toHaveFocus()
})

test('a month with nothing in it keeps its grid: every day drawn, the month named on the 1st', () => {
  render(<Picker start="2026-06-29" end="2026-07-05" counts={{}} />)
  expect(days()).toHaveLength(7)
  expect(days().every((b) => /0 achievements/.test(b.getAttribute('aria-label') ?? ''))).toBe(true)
  expect(within(screen.getByRole('button', { name: /July 1/ })).getByText('Jul')).toBeInTheDocument()
  // The streak's first day names its month too.
  expect(within(screen.getByRole('button', { name: /June 29/ })).getByText('Jun')).toBeInTheDocument()
})
