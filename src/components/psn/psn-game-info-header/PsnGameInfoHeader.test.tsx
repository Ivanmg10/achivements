jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))
jest.mock('@/components/hide-game-button/HideGameButton', () => ({ __esModule: true, default: () => <span data-testid="hide" /> }))

import { render, screen } from '@testing-library/react'
import PsnGameInfoHeader from './PsnGameInfoHeader'
import { en } from '@/translations/en'
import type { PsnGameProgress } from '@/types/psn'
import { psnGameFixture } from '@/test-utils/psnFixtures'

const GAME: PsnGameProgress = psnGameFixture({
  id: 100, titleId: 'NPWR00001_00', service: 'trophy', title: 'Bloodborne', imageIcon: 'https://b.png',
  consoleName: 'PS4', maxPossible: 34, numAwarded: 12, pctWon: 40, lastPlayed: '2026-01-02T00:00:00Z',
  earned: { bronze: 10, silver: 2, gold: 0, platinum: 0 }, defined: { bronze: 20, silver: 10, gold: 3, platinum: 1 },
  lastTrophyAt: '2026-01-02T00:00:00Z', playtimeMinutes: null, playedAs: [], playCount: null, coverUrl: null, heroUrl: null,
})

test('title as the page heading, platform, progress and facts', () => {
  render(<PsnGameInfoHeader game={GAME} />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bloodborne')
  expect(screen.getAllByText('PS4').length).toBeGreaterThan(0)
  expect(screen.getByText(en.gameStatus.inProgress)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Bloodborne' })).toHaveAttribute('aria-valuenow', '40')
  expect(screen.getByText('NPWR00001_00')).toBeInTheDocument()
  // On the bar and on the badge.
  expect(screen.getAllByText('12 / 34')).toHaveLength(2)
  expect(screen.getByTestId('pin')).toBeInTheDocument()
  expect(screen.getByTestId('hide')).toBeInTheDocument()
})

test('a platinum still to get is said in words', () => {
  render(<PsnGameInfoHeader game={GAME} />)
  expect(screen.getByText(en.psn.locked)).toBeInTheDocument()
})

test('a platinum earned gets its chip', () => {
  render(<PsnGameInfoHeader game={{ ...GAME, pctWon: 100, earned: GAME.defined }} />)
  expect(screen.getByText(`★ ${en.psn.platinum}`)).toBeInTheDocument()
  expect(screen.queryByText(en.gameStatus.inProgress)).not.toBeInTheDocument()
})

test('the box art and play time when Sony has them, the trophy icon otherwise', () => {
  const { container, rerender } = render(<PsnGameInfoHeader game={{ ...GAME, coverUrl: 'https://cover.png', playtimeMinutes: 90 }} />)
  expect(screen.getByRole('img', { name: 'Bloodborne' })).toHaveAttribute('src', 'https://cover.png')
  expect(screen.getByText(`1.5 ${en.steam.hoursShort}`)).toBeInTheDocument()
  rerender(<PsnGameInfoHeader game={GAME} />)
  expect(container.querySelector('img[src="https://cover.png"]')).toBeNull()
  expect(screen.queryByText(en.steam.playtime)).not.toBeInTheDocument()
})
