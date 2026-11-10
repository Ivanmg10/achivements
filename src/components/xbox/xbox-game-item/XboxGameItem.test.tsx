jest.mock('@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: () => <div data-testid="expanded" />,
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))

import { render, screen } from '@testing-library/react'
import XboxGameItem from './XboxGameItem'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture({
  id: 1738914043, titleId: '1738914043', title: 'Halo', consoleName: 'Xbox Series', maxPossible: 50, numAwarded: 20, totalKnown: true,
  pctWon: 40, earnedGamerscore: 200, totalGamerscore: 1000, lastPlayed: '2026-01-02T00:00:00Z',
})

test('a row with the game, its platform, progress, gamerscore and pin', () => {
  render(<XboxGameItem game={GAME} />)
  expect(screen.getByRole('link', { name: 'Halo' })).toHaveAttribute('href', '/xboxGame/1738914043')
  expect(screen.getByText('Xbox Series')).toBeInTheDocument()
  expect(screen.getByText('20 / 50 achievements')).toBeInTheDocument()
  expect(screen.getByText('200')).toBeInTheDocument()
  expect(screen.getByText('/1,000')).toBeInTheDocument()
  expect(screen.getByTestId('pin')).toBeInTheDocument()
})

test('a game whose total Xbox does not say shows only what is earned', () => {
  render(<XboxGameItem game={{ ...GAME, totalKnown: false, maxPossible: 0 }} />)
  expect(screen.getByText('20 achievements')).toBeInTheDocument()
})





test('a finished game reads 100% in green, and is ringed', () => {
  const { container } = render(<XboxGameItem game={{ ...GAME, pctWon: 100 }} />)
  expect(screen.getByText('100%')).toHaveClass('text-success')
  expect(container.querySelector('.ring-success')).toBeInTheDocument()
})



