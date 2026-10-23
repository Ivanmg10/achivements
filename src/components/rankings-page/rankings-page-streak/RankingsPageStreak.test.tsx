import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import RankingsPageStreak from './RankingsPageStreak'

test('shows the current and the longest streak, and says both in one sentence', () => {
  render(<RankingsPageStreak streak={3} best={12} />)
  expect(screen.getByText(en.rankings.streakLabel.replace('{n}', '3').replace('{best}', '12'))).toBeInTheDocument()
  expect(screen.getByText(en.rankings.streakBest.replace('{n}', '12'))).toBeInTheDocument()
})
