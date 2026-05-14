import { render, screen } from '@testing-library/react'
import GameInfoProgressionHeader from './GameInfoProgressionHeader'

const mockGameData = {
  UserCompletion: '50%',
  UserCompletionHardcore: '25%',
} as any

test('renders softcore percentage', () => {
  render(<GameInfoProgressionHeader gameData={mockGameData} />)
  expect(screen.getByText('50%')).toBeInTheDocument()
})

test('renders hardcore percentage when > 0', () => {
  render(<GameInfoProgressionHeader gameData={mockGameData} />)
  expect(screen.getByText('25%')).toBeInTheDocument()
})

test('renders without gameData', () => {
  const { container } = render(<GameInfoProgressionHeader />)
  expect(container.firstChild).toBeInTheDocument()
})

test('hides hardcore label when hardcorePct is 0', () => {
  render(<GameInfoProgressionHeader gameData={{ UserCompletion: '50%', UserCompletionHardcore: '0%' } as any} />)
  expect(screen.queryByText('0%')).toBeNull()
})
