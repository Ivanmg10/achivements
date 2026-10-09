import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfilePsnTrophies from './MainPageProfilePsnTrophies'
import { en } from '@/translations/en'
import type { PsnRecentTrophy } from '@/types/psn'

const trophy = (n: number): PsnRecentTrophy => ({
  gameId: 2018800, titleId: 'NPWR20188_00', gameTitle: 'Astro Bot', gameIconUrl: '', trophyId: n,
  name: `Trophy ${n}`, iconUrl: null, type: 'gold', earnedAt: '2026-01-02T00:00:00Z', rarity: null,
})

test('the latest three, each linking to its trophy on the game page', () => {
  render(<MainPageProfilePsnTrophies trophies={[trophy(1), trophy(2), trophy(3), trophy(4)]} isLoading={false} error={null} onRetry={jest.fn()} />)
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(3)
  expect(links[0]).toHaveAttribute('href', '/psnGame/NPWR20188_00#trophy-1')
  expect(links[0]).toHaveTextContent(en.psn.gold)
})

test('empty, loading and failed states', () => {
  const onRetry = jest.fn()
  const { rerender, container } = render(<MainPageProfilePsnTrophies trophies={[]} isLoading={false} error={null} onRetry={onRetry} />)
  expect(screen.getByText(en.cards.noEarned)).toBeInTheDocument()
  rerender(<MainPageProfilePsnTrophies trophies={[]} isLoading error={null} onRetry={onRetry} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  rerender(<MainPageProfilePsnTrophies trophies={[]} isLoading={false} error="failed" onRetry={onRetry} />)
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(onRetry).toHaveBeenCalled()
})
