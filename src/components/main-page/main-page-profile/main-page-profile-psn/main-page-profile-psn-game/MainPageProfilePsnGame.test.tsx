import { render, screen } from '@testing-library/react'
import MainPageProfilePsnGame from './MainPageProfilePsnGame'
import type { PsnGameProgress } from '@/types/psn'

const GAME = {
  _source: 'psn', id: 2018800, titleId: 'NPWR20188_00', service: 'trophy2', title: 'Astro Bot', imageIcon: '',
  consoleName: 'PS5', maxPossible: 45, numAwarded: 20, pctWon: 44, lastPlayed: '2026-01-02T00:00:00Z',
  earned: { bronze: 18, silver: 2, gold: 0, platinum: 0 }, defined: { bronze: 30, silver: 10, gold: 4, platinum: 1 },
} as PsnGameProgress

test('the last game played, with its progress, opening its page', () => {
  render(<MainPageProfilePsnGame game={GAME} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/psnGame/NPWR20188_00')
  expect(screen.getByText('Astro Bot')).toBeInTheDocument()
  expect(screen.getByText('20 / 45')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Astro Bot' })).toHaveAttribute('aria-valuenow', '44')
})
