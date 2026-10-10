jest.mock('@/components/psn/psn-game-item-trophies/PsnGameItemTrophies', () => ({
  __esModule: true,
  default: ({ titleId }: { titleId: string }) => <div data-testid="trophies">{titleId}</div>,
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))
jest.mock('@/components/hide-game-button/HideGameButton', () => ({ __esModule: true, default: () => <span data-testid="hide" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnStatusGameItem from './PsnStatusGameItem'
import { en } from '@/translations/en'
import type { PsnGameProgress } from '@/types/psn'
import { psnGameFixture } from '@/test-utils/psnFixtures'

const GAME: PsnGameProgress = psnGameFixture({
  id: 100,
  titleId: 'NPWR00001_00',
  service: 'trophy2',
  title: 'Astro Bot',
  imageIcon: 'https://a.png',
  consoleName: 'PS5',
  maxPossible: 45,
  numAwarded: 45,
  pctWon: 100,
  lastPlayed: '2026-01-02T00:00:00Z',
  earned: { bronze: 30, silver: 10, gold: 4, platinum: 1 },
  defined: { bronze: 30, silver: 10, gold: 4, platinum: 1 },
  lastTrophyAt: '2026-01-02T00:00:00Z', playtimeMinutes: null, playedAs: [], playCount: null, coverUrl: null, heroUrl: null,
})

test('links to the game page and shows its progress', () => {
  render(<PsnStatusGameItem game={GAME} />)
  expect(screen.getByRole('link', { name: 'Astro Bot' })).toHaveAttribute('href', '/psnGame/NPWR00001_00')
  expect(screen.getByText('PS5')).toBeInTheDocument()
  expect(screen.getByText('45 / 45 trophies')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Astro Bot' })).toHaveAttribute('aria-valuenow', '100')
  expect(screen.getByTestId('pin')).toBeInTheDocument()
  expect(screen.getByTestId('hide')).toBeInTheDocument()
})

test('a platinum earned gets its chip; none without', () => {
  const { container, rerender } = render(<PsnStatusGameItem game={GAME} />)
  expect(container.textContent).toContain(`★ ${en.psn.platinum}`)
  rerender(<PsnStatusGameItem game={{ ...GAME, pctWon: 50, earned: { ...GAME.earned, platinum: 0 } }} />)
  expect(container.textContent).not.toContain('★')
})

test('expands to its trophies, loaded only then', () => {
  render(<PsnStatusGameItem game={GAME} />)
  const toggle = screen.getByRole('button', { name: `${en.psn.showTrophies}: Astro Bot` })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByTestId('trophies')).toHaveTextContent('NPWR00001_00')
})

test('play time and the last session, where Sony has them', () => {
  const { rerender } = render(<PsnStatusGameItem game={{ ...GAME, playtimeMinutes: 600 }} />)
  expect(screen.getByText(`${en.steam.playtime} · 10 ${en.steam.hoursShort}`)).toBeInTheDocument()
  expect(screen.getByText(new RegExp(en.steam.lastPlayed))).toBeInTheDocument()
  rerender(<PsnStatusGameItem game={GAME} />)
  expect(screen.queryByText(new RegExp(`${en.steam.playtime} ·`))).not.toBeInTheDocument()
})
