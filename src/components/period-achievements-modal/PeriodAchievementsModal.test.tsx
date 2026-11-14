import { render, screen, fireEvent } from '@testing-library/react'
import PeriodAchievementsModal from './PeriodAchievementsModal'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

/** The footer's line: Facts split it over several nodes, so match on the whole text. */
const footer = () => document.querySelector('p.text-xs')!

function ach(date: string, over: Partial<RecentAchievement> = {}): RecentAchievement {
  return {
    Date: `${date} 12:00:00`, HardcoreMode: '1', AchievementID: Math.random(), Title: 'Triforce', Description: '', BadgeName: '1',
    Points: 25, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES', ...over,
  }
}

test('lists RA unlocks by day under the given title, with points', () => {
  render(<PeriodAchievementsModal title="This week" achievements={[ach('2020-01-16'), ach('2020-01-17')]} onClose={jest.fn()} />)
  expect(screen.getByText('This week')).toBeInTheDocument()
  expect(screen.getAllByText('Triforce')).toHaveLength(2)
  // The footer: the count in its plural and the points, joined by the mark.
  expect(footer()).toHaveTextContent('2 achievements, 50 points')
})

test('day heads: the weekday with one capital and the one date format, no "capitalize" of every word', () => {
  render(<PeriodAchievementsModal title="This week" achievements={[ach('2020-01-16')]} onClose={jest.fn()} />)
  const head = screen.getByText('Thursday, Jan 16, 2020')
  expect(head.className).not.toMatch(/capitalize/)
  expect(footer()).toHaveTextContent('1 achievement, 25 points')
})

test('a singular count is "1 achievement", never "1 achievements"', () => {
  render(<PeriodAchievementsModal title="x" achievements={[ach('2020-01-16')]} onClose={jest.fn()} />)
  expect(document.body).not.toHaveTextContent(/1 achievements/)
})

test('shows the hint when given', () => {
  render(<PeriodAchievementsModal title="Best week" hint="Week of Jan 15" achievements={[]} onClose={jest.fn()} />)
  expect(screen.getByText('Week of Jan 15')).toBeInTheDocument()
})

test('lists Steam unlocks as counts only', () => {
  const steam = ach('2020-01-16', { Title: 'Win', Points: 0, GameID: 620, BadgeName: '', Source: 'steam' })
  render(<PeriodAchievementsModal title="This week" achievements={[steam]} onClose={jest.fn()} />)
  expect(screen.getByRole('link', { name: /Win/ }).getAttribute('href')).toBe('/steamGame/620')
  expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
})

test('a list that mixes platforms shows no points: a total that leaves rows out would mislead', () => {
  const steam = ach('2020-01-16', { Title: 'Win', Points: 0, GameID: 620, BadgeName: '', Source: 'steam' })
  render(<PeriodAchievementsModal title="x" achievements={[ach('2020-01-16'), steam]} onClose={jest.fn()} />)
  expect(footer()).toHaveTextContent(/^2 achievements$/)
})

test('says so when empty, and closes', () => {
  const onClose = jest.fn()
  render(<PeriodAchievementsModal title="This month" achievements={[]} empty={en.dayModal.empty} onClose={onClose} />)
  expect(screen.getByText(en.dayModal.empty)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})
