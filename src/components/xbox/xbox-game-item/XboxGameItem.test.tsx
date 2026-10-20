jest.mock('@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: () => <div data-testid="expanded" />,
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxGameItem from './XboxGameItem'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { formatPlaytime } from '@/utils/steamFeed'

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

test('expands on its own when not controlled', () => {
  render(<XboxGameItem game={GAME} />)
  expect(screen.queryByTestId('expanded')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${en.xbox.showAchievements}: Halo` }))
  expect(screen.getByTestId('expanded')).toBeInTheDocument()
})

test('a controlled card asks its parent', () => {
  const onToggle = jest.fn()
  render(<XboxGameItem game={GAME} expanded onToggle={onToggle} />)
  expect(screen.getByTestId('expanded')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${en.xbox.hideAchievements}: Halo` }))
  expect(onToggle).toHaveBeenCalled()
})

test('a finished game is marked, and the link goes to the page of whoever is being looked at', () => {
  const { container } = render(<XboxGameItem game={{ ...GAME, pctWon: 100 }} />)
  expect(screen.getByText('100%')).toHaveClass('text-success')
  expect(container.querySelector('.ring-green-500')).toBeInTheDocument()
})

const MINUTES = 3409
const PLAYED = formatPlaytime(MINUTES, { minutes: en.steam.minutesShort, hours: en.steam.hoursShort }, 'en')

test('the play time, when Xbox gave it, and not otherwise', () => {
  const { rerender } = render(<XboxGameItem game={{ ...GAME, playtimeMinutes: MINUTES }} />)
  expect(screen.getByText(PLAYED)).toBeInTheDocument()
  rerender(<XboxGameItem game={GAME} />)
  expect(screen.queryByText(PLAYED)).not.toBeInTheDocument()
})
