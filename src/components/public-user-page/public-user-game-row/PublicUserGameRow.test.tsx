import { render, screen } from '@testing-library/react'
import PublicUserGameRow from './PublicUserGameRow'
import type { LibraryGame } from '@/utils/library'

const GAME: LibraryGame = { key: 'ra:1', source: 'ra', id: 1, title: 'Zelda', subtitle: 'SNES', status: 'completed', pct: 100, href: '/user/ivan/ra/1' }

test('opens their progress in the game, with where it is played and how far', () => {
  render(<PublicUserGameRow game={GAME} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/user/ivan/ra/1')
  expect(screen.getByText('SNES · RetroAchievements')).toBeInTheDocument()
  expect(screen.getByText('100%')).toHaveClass('text-success')
  expect(screen.getByRole('progressbar', { name: 'Zelda' })).toHaveAttribute('aria-valuenow', '100')
})

test('a platform name is not said twice', () => {
  render(<PublicUserGameRow game={{ ...GAME, key: 'steam:7', source: 'steam', id: 7, subtitle: 'Steam', pct: 40 }} />)
  expect(screen.getByText('Steam')).toBeInTheDocument()
  expect(screen.getByText('40%')).not.toHaveClass('text-success')
})
