import { fireEvent, render, screen } from '@testing-library/react'
import StreakDayStrip from './StreakDayStrip'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

test('one button per day of the streak, the picked one pressed, each saying how much it had', () => {
  const onSelect = jest.fn()
  render(<StreakDayStrip start="2026-06-01" end="2026-06-03" counts={{ '2026-06-02': 4 }} selected="2026-06-03" onSelect={onSelect} />)
  expect(screen.getAllByRole('button')).toHaveLength(3)
  expect(screen.getByRole('button', { name: /June 2: 4 achievements/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /June 3: 0 achievements/ })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: /June 1/ }))
  expect(onSelect).toHaveBeenCalledWith('2026-06-01')
})

test('a day far above the rest is cut and says its figure', () => {
  const counts: Record<string, number> = {}
  for (let d = 1; d <= 20; d++) counts[`2026-06-${String(d).padStart(2, '0')}`] = 3
  counts['2026-06-10'] = 90
  const { container } = render(<StreakDayStrip start="2026-06-01" end="2026-06-20" counts={counts} selected="2026-06-20" onSelect={jest.fn()} />)
  const cut = container.querySelectorAll('[data-cut]')
  expect(cut).toHaveLength(1)
  expect(screen.getByText('90')).toBeInTheDocument()
  // It is no taller than an ordinary busy day.
  const bar = (name: RegExp) => (screen.getByRole('button', { name }).querySelector('span:last-child') as HTMLElement).style.height
  expect(bar(/June 10/)).toBe(bar(/June 9/))
})
