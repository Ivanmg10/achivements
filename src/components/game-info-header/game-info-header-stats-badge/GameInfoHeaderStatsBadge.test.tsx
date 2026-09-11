import { render, screen } from '@testing-library/react'
import GameInfoHeaderStatsBadge from './GameInfoHeaderStatsBadge'

test('renders the label and value', () => {
  render(<GameInfoHeaderStatsBadge label="Achievements" value="5 / 10" done={false} />)
  expect(screen.getByText('Achievements')).toBeInTheDocument()
  expect(screen.getByText('5 / 10')).toBeInTheDocument()
})

test('applies the success color once done', () => {
  render(<GameInfoHeaderStatsBadge label="Points" value="15 / 15" done />)
  expect(screen.getByText('15 / 15').closest('div')).toHaveClass('text-success')
})

test('uses the neutral color while not done', () => {
  render(<GameInfoHeaderStatsBadge label="Points" value="5 / 15" done={false} />)
  expect(screen.getByText('5 / 15').closest('div')).not.toHaveClass('text-success')
})
