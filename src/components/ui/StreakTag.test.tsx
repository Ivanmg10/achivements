import { render, screen } from '@testing-library/react'
import StreakTag from './StreakTag'

test('a streak going is lit, with a filled flame and its days', () => {
  const { container } = render(<StreakTag days={48} text="48 d" aria-label="Streak: 48 days" />)
  expect(screen.getByLabelText('Streak: 48 days')).toHaveAttribute('data-tier', 'inferno')
  expect(screen.getByTestId('IconFlameFilled')).toBeInTheDocument()
  expect(container).toHaveTextContent('48 d')
})

test('no streak is dimmed, with an outline flame', () => {
  render(<StreakTag days={0} text="0 d" aria-label="Streak: 0 days" />)
  expect(screen.getByLabelText('Streak: 0 days')).toHaveClass('text-text-secondary')
  expect(screen.getByTestId('IconFlame')).toBeInTheDocument()
  expect(screen.queryByTestId('IconFlameFilled')).not.toBeInTheDocument()
})

test('each tier has its own colour, from the days', () => {
  const tag = (days: number) => render(<StreakTag days={days} text={`${days} d`} aria-label={`s${days}`} />).getByLabelText(`s${days}`)
  const colours = [1, 5, 10, 20, 30, 40, 50].map((d) => tag(d).style.backgroundColor)
  expect(new Set(colours).size).toBe(7)
})
