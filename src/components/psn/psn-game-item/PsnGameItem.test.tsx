jest.mock('@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: () => <div data-testid="expanded" />,
}))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({ PinToggleButton: () => <span data-testid="pin" /> }))

import { render, screen } from '@testing-library/react'
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






