import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import RankingsPageStreak from './RankingsPageStreak'

const label = (n: number, best: number) => en.rankings.streakLabel.replace('{n}', String(n)).replace('{best}', String(best))

test('shows the current streak and the longest under it, and says both in one sentence', () => {
  render(<RankingsPageStreak streak={3} best={12} />)
  expect(screen.getByText(label(3, 12))).toBeInTheDocument()
  expect(screen.getByText('3 d')).toHaveClass('text-accent')
  expect(screen.getByText('best 12 d')).toHaveClass('text-text-secondary')
})

test('the longest is in the accent while the current streak is the record', () => {
  render(<RankingsPageStreak streak={12} best={12} />)
  expect(screen.getByText('best 12 d')).toHaveClass('text-accent')
})

test('no streak ever: a dimmed 0 and no longest', () => {
  render(<RankingsPageStreak streak={0} best={0} />)
  expect(screen.getByText('0 d')).toHaveClass('text-text-secondary')
  expect(screen.queryByText(/best/)).not.toBeInTheDocument()
})
