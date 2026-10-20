import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import VaultWeeksChart from './VaultWeeksChart'

test('a bar a week, each saying its week and points in words', () => {
  render(<VaultWeeksChart weeks={[{ start: '2026-10-05', points: 0 }, { start: '2026-10-12', points: 880 }, { start: '2026-10-19', points: 1200 }]} />)
  expect(screen.getByText(en.rankings.weeksTitle)).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(screen.getByText('Week of Oct 19: 1,200 VP')).toBeInTheDocument()
})

test('nothing without weeks', () => {
  const { container } = render(<VaultWeeksChart weeks={[]} />)
  expect(container).toBeEmptyDOMElement()
})
