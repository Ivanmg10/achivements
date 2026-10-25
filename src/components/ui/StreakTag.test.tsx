import { render, screen } from '@testing-library/react'
import StreakTag from './StreakTag'

test('a streak going is lit, with a filled flame and its days', () => {
  const { container } = render(<StreakTag days={48} text="48 d" aria-label="Streak: 48 days" />)
  expect(screen.getByLabelText('Streak: 48 days')).toHaveClass('text-accent')
  expect(screen.getByTestId('IconFlameFilled')).toBeInTheDocument()
  expect(container).toHaveTextContent('48 d')
})

test('no streak is dimmed, with an outline flame', () => {
  render(<StreakTag days={0} text="0 d" aria-label="Streak: 0 days" />)
  expect(screen.getByLabelText('Streak: 0 days')).toHaveClass('text-text-secondary')
  expect(screen.getByTestId('IconFlame')).toBeInTheDocument()
  expect(screen.queryByTestId('IconFlameFilled')).not.toBeInTheDocument()
})
