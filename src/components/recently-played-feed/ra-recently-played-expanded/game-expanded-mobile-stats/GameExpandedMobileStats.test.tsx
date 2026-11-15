import { render, screen } from '@testing-library/react'
import { GameExpandedMobileStats } from './GameExpandedMobileStats'

test('renders points, hardcore points, completion and remaining stats', () => {
  render(
    <GameExpandedMobileStats
      points={203}
      totalPoints={715}
      hardcorePoints={203}
      completionPct={46}
      remaining={57}
    />,
  )
  expect(screen.getByText('Points')).toBeInTheDocument()
  expect(screen.getByText('203/715')).toBeInTheDocument()
  expect(screen.getByText('Hardcore points')).toBeInTheDocument()
  expect(screen.getByText('203')).toBeInTheDocument()
  expect(screen.getByText('Completion')).toBeInTheDocument()
  expect(screen.getByText('46%')).toBeInTheDocument()
  expect(screen.getByText('Remaining')).toBeInTheDocument()
  expect(screen.getByText('57')).toBeInTheDocument()
})
