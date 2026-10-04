import { fireEvent, render, screen } from '@testing-library/react'
import StreakCalendar from './StreakCalendar'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

test('one button per day of the streak, the picked one pressed, each saying how much it had', () => {
  const onSelect = jest.fn()
  render(<StreakCalendar start="2026-06-01" end="2026-06-03" counts={{ '2026-06-02': 4 }} selected="2026-06-03" onSelect={onSelect} />)
  const days = screen.getAllByRole('button')
  expect(days).toHaveLength(3)
  expect(screen.getByRole('button', { name: /June 2: 4 achievements/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /June 3: 0 achievements/ })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: /June 1/ }))
  expect(onSelect).toHaveBeenCalledWith('2026-06-01')
})

test('the first day sits under its own weekday (Monday first)', () => {
  // 2026-06-03 is a Wednesday: two blank cells before it.
  const { container } = render(<StreakCalendar start="2026-06-03" end="2026-06-03" counts={{}} selected="2026-06-03" onSelect={jest.fn()} />)
  const grid = container.querySelector('[role="group"]')!
  expect(grid.children[0].tagName).toBe('SPAN')
  expect(grid.children[1].tagName).toBe('SPAN')
  expect(grid.children[2].tagName).toBe('BUTTON')
})
