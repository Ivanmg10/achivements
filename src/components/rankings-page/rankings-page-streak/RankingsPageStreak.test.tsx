import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import RankingsPageStreak from './RankingsPageStreak'

const label = (n: number, best: number) => en.rankings.streakLabel.replace('{n}', String(n)).replace('{best}', String(best))

test('shows the current and the longest streak, and says both in one sentence', () => {
  render(<RankingsPageStreak streak={3} best={12} />)
  expect(screen.getByText(label(3, 12))).toBeInTheDocument()
  expect(screen.getByText('3d')).toBeInTheDocument()
  expect(screen.getByText('12d')).not.toHaveClass('text-warning')
})

test('the crown turns gold while the current streak is the record', () => {
  render(<RankingsPageStreak streak={12} best={12} />)
  expect(screen.getAllByText('12d')[1]).toHaveClass('text-warning')
})

test('no streak ever: a dimmed 0 and no crown', () => {
  render(<RankingsPageStreak streak={0} best={0} />)
  expect(screen.getByText('0d')).toHaveClass('text-text-secondary')
  expect(screen.queryAllByText('0d')).toHaveLength(1)
})
