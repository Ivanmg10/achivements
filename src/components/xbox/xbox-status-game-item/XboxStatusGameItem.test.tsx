jest.mock('@/components/xbox/xbox-library-detail/XboxLibraryDetail', () => ({
  __esModule: true,
  default: ({ game, category }: { game: { titleId: string }; category?: string }) => (
    <div data-testid="detail">{game.titleId}:{category}</div>
  ),
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))
jest.mock('@/components/hide-game-button/HideGameButton', () => ({ __esModule: true, default: () => <span data-testid="hide" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxStatusGameItem from './XboxStatusGameItem'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture({
  id: 1738914043, titleId: '1738914043', title: 'Halo', consoleName: 'Xbox Series · PC', maxPossible: 45, numAwarded: 45, totalKnown: true,
  pctWon: 100, earnedGamerscore: 1000, totalGamerscore: 1000, lastPlayed: '2026-01-02T00:00:00Z',
})

test('links to the game page and shows its progress', () => {
  render(<XboxStatusGameItem game={GAME} />)
  expect(screen.getByRole('link', { name: 'Halo' })).toHaveAttribute('href', '/xboxGame/1738914043')
  expect(screen.getByText('Xbox Series · PC')).toBeInTheDocument()
  expect(screen.getByText('45 / 45 achievements')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Halo' })).toHaveAttribute('aria-valuenow', '100')
  expect(screen.getByTestId('pin')).toBeInTheDocument()
  expect(screen.getByTestId('hide')).toBeInTheDocument()
})

test('a perfect game gets its chip; one still under way does not', () => {
  const { container, rerender } = render(<XboxStatusGameItem game={GAME} />)
  expect(container.textContent).toContain(`★ ${en.steam.perfect}`)
  rerender(<XboxStatusGameItem game={{ ...GAME, pctWon: 50 }} />)
  expect(container.textContent).not.toContain('★')
})

test('a game whose total Xbox does not say is written with what is earned', () => {
  render(<XboxStatusGameItem game={{ ...GAME, totalKnown: false, maxPossible: 0, pctWon: 14 }} />)
  expect(screen.getByText('45 achievements')).toBeInTheDocument()
})

test('expands to its detail for the list it is in, loaded only then', () => {
  render(<XboxStatusGameItem game={GAME} category="completed" />)
  const toggle = screen.getByRole('button', { name: `${en.xbox.showAchievements}: Halo` })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByTestId('detail')).toHaveTextContent('1738914043:completed')
})

test('the last session, where there is one', () => {
  const { rerender } = render(<XboxStatusGameItem game={GAME} />)
  expect(screen.getByText(new RegExp(en.steam.lastPlayed))).toBeInTheDocument()
  rerender(<XboxStatusGameItem game={{ ...GAME, lastPlayed: null }} />)
  expect(screen.queryByText(new RegExp(en.steam.lastPlayed))).not.toBeInTheDocument()
})
