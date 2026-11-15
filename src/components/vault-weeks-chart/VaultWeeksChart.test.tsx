import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import VaultWeeksChart from './VaultWeeksChart'

test('a bar a week, each saying its week and points in words', () => {
  render(<VaultWeeksChart weeks={[{ start: '2026-10-05', points: 0 }, { start: '2026-10-12', points: 880 }, { start: '2026-10-19', points: 1200 }]} />)
  expect(screen.getByText(en.rankings.weeksTitle)).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(screen.getByText('Week of Oct 19: 1,200 VP')).toBeInTheDocument()
})

test('titled "Points per week", the Monday of each week under its bar and the month where it changes', () => {
  render(<VaultWeeksChart weeks={[{ start: '2026-10-26', points: 5 }, { start: '2026-11-02', points: 880 }, { start: '2026-11-09', points: 1200 }]} />)
  expect(screen.getByText('Points per week')).toBeVisible()
  for (const text of ['26', 'Oct', '2', 'Nov', '9']) expect(screen.getByText(text)).toBeInTheDocument()
  // The month is said once, where it begins.
  expect(screen.getAllByText('Nov')).toHaveLength(1)
})

test('nothing without weeks', () => {
  const { container } = render(<VaultWeeksChart weeks={[]} />)
  expect(container).toBeEmptyDOMElement()
})
