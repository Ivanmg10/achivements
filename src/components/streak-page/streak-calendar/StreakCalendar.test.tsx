import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import StreakCalendar from './StreakCalendar'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))
const wide = { current: true }
jest.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => wide.current }))

beforeEach(() => {
  wide.current = true
})

// 2026-06-03 is a Wednesday; 2026-01-05 a Monday.
function Picker({ start = '2026-06-03', end = '2026-06-16', counts = { '2026-06-04': 4 } as Record<string, number> }) {
  const [day, setDay] = useState(end)
  return <StreakCalendar start={start} end={end} today="2026-06-16" counts={counts} selected={day} onSelect={setDay} />
}
const LONG = { start: '2026-01-05', end: '2026-06-14', counts: {} }

const group = () => screen.getByRole('group', { name: 'Day by day' })
const days = () => within(group()).getAllByRole('button')
const cells = () => [...group().querySelectorAll<HTMLElement>('.aspect-square')]
const place = (name: RegExp) => {
  const { gridRow, gridColumn } = screen.getByRole('button', { name }).style
  return [Number(gridRow), Number(gridColumn)]
}
const prev = () => screen.getByRole('button', { name: 'Earlier weeks' })
const next = () => screen.getByRole('button', { name: 'Later weeks' })
const picked = () => screen.getByRole('button', { pressed: true })

test('a short streak keeps the whole window: thirteen weeks, the days before it dimmed and not buttons', () => {
  render(<Picker />)
  expect(cells()).toHaveLength(91)
  expect(days()).toHaveLength(14)
  // The streak ends the window: Tuesday the 16th in the last column (row 1 is the months, column 1 the weekdays).
  expect(place(/Tuesday, June 16/)).toEqual([3, 14])
  expect(place(/Wednesday, June 3/)).toEqual([4, 12])
  expect(prev()).toBeDisabled()
  expect(next()).toBeDisabled()
  expect(screen.getByText(/Jun 3.*–.*Jun 16/)).toBeInTheDocument()
})

test('seven weeks on a phone', () => {
  wide.current = false
  render(<Picker />)
  expect(cells()).toHaveLength(49)
  expect(group().style.gridTemplateColumns).toBe('auto repeat(7, minmax(1.75rem, 2rem))')
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

test('a long streak opens on its last weeks and pages through them, the buttons off at the ends', () => {
  render(<Picker {...LONG} />)
  expect(days()).toHaveLength(13 * 7)
  expect(next()).toBeDisabled()
  expect(screen.getByRole('button', { name: /March 16/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /March 15/ })).toBeNull()

  fireEvent.click(prev())
  // 23 weeks: back to the first one, not past it.
  expect(screen.getByRole('button', { name: /Monday, January 5/ })).toBeInTheDocument()
  expect(screen.getByText(/Jan 5.*–.*Apr 5/)).toBeInTheDocument()
  expect(prev()).toBeDisabled()
  expect(next()).toBeEnabled()
  // The picked day is paged away: the first day shown is the tab stop.
  expect(days().filter((b) => b.tabIndex === 0).map((b) => b.dataset.day)).toEqual(['2026-01-05'])

  fireEvent.click(next())
  expect(screen.getByRole('button', { name: /June 14/ })).toHaveAttribute('aria-pressed', 'true')
  expect(next()).toBeDisabled()
})

test('one tab stop; left and right move a week, up and down a day, Home and End to the ends, and focus follows', () => {
  render(<Picker />)
  expect(days().filter((b) => b.tabIndex === 0)).toHaveLength(1)

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
  fireEvent.keyDown(picked(), { key: 'ArrowRight' })
  expect(picked()).toHaveAccessibleName(/June 16/)
  expect(picked()).toHaveFocus()
})

test('the keyboard leaving the window moves it, a week at a time or to the end', () => {
  render(<Picker {...LONG} />)
  fireEvent.click(screen.getByRole('button', { name: /Monday, March 16/ }))
  fireEvent.keyDown(picked(), { key: 'ArrowLeft' })
  expect(picked()).toHaveAccessibleName(/Monday, March 9/)
  expect(picked()).toHaveFocus()
  expect(screen.queryByRole('button', { name: /June 14/ })).toBeNull()

  fireEvent.keyDown(picked(), { key: 'Home' })
  expect(picked()).toHaveAccessibleName(/January 5/)
  expect(picked()).toHaveFocus()
  expect(prev()).toBeDisabled()

  fireEvent.keyDown(picked(), { key: 'End' })
  expect(picked()).toHaveAccessibleName(/June 14/)
  expect(picked()).toHaveFocus()
  expect(next()).toBeDisabled()
})

test('the months: over the first week shown and over the week a 1st falls in', () => {
  render(<Picker start="2026-06-22" end="2026-07-12" counts={{}} />)
  const months = [...group().querySelectorAll<HTMLElement>('span[aria-hidden="true"]')].filter((s) => s.style.gridRow === '1')
  // Thirteen weeks back from the week of July 6: April 13 opens the window.
  expect(months.map((m) => [m.textContent, m.style.gridColumn])).toEqual([['Apr', '2'], ['May', '4'], ['Jun', '9'], ['Jul', '13']])
})
