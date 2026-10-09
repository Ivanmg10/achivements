jest.mock('@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: () => <div data-testid="expanded" />,
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnGameItem from './PsnGameItem'
import { en } from '@/translations/en'
import type { PsnGameProgress } from '@/types/psn'

const GAME = {
  _source: 'psn', id: 100, titleId: 'NPWR00001_00', service: 'trophy2', title: 'Astro Bot', imageIcon: 'https://a.png',
  consoleName: 'PS5', maxPossible: 10, numAwarded: 10, pctWon: 100, lastPlayed: '2026-01-02T00:00:00Z',
  earned: { bronze: 9, silver: 0, gold: 0, platinum: 1 }, defined: { bronze: 9, silver: 0, gold: 0, platinum: 1 },
} as PsnGameProgress

test('a row with the game, its platform, progress and pin', () => {
  render(<PsnGameItem game={GAME} />)
  expect(screen.getByRole('link', { name: 'Astro Bot' })).toHaveAttribute('href', '/psnGame/NPWR00001_00')
  expect(screen.getByText('PS5')).toBeInTheDocument()
  expect(screen.getByText(`10/10 ${en.psn.trophies.toLowerCase()}`)).toBeInTheDocument()
  expect(screen.getByText(en.psn.platinum)).toBeInTheDocument()
  expect(screen.getByTestId('pin')).toBeInTheDocument()
})

test('expands on its own when not controlled', () => {
  render(<PsnGameItem game={GAME} />)
  expect(screen.queryByTestId('expanded')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${en.psn.showTrophies}: Astro Bot` }))
  expect(screen.getByTestId('expanded')).toBeInTheDocument()
})

test('a controlled card asks its parent', () => {
  const onToggle = jest.fn()
  render(<PsnGameItem game={GAME} expanded onToggle={onToggle} />)
  expect(screen.getByTestId('expanded')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${en.psn.hideTrophies}: Astro Bot` }))
  expect(onToggle).toHaveBeenCalled()
})

test('shows play time where Sony reports it', () => {
  render(<PsnGameItem game={{ ...GAME, playtimeMinutes: 125 } as PsnGameProgress} />)
  expect(screen.getByText(`${en.steam.playtime}:`, { exact: false }).parentElement).toHaveTextContent(`2.1 ${en.steam.hoursShort}`)
})
