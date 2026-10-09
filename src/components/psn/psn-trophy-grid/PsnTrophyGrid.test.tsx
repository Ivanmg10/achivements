jest.mock('@/hooks/usePsnFavoriteTrophies', () => ({ usePsnFavoriteTrophies: jest.fn() }))

import { render, screen, fireEvent, act } from '@testing-library/react'
import { PsnTrophyGrid } from './PsnTrophyGrid'
import { en } from '@/translations/en'
import { usePsnFavoriteTrophies } from '@/hooks/usePsnFavoriteTrophies'
import type { PsnTrophy } from '@/types/psn'

const trophy = (overrides: Partial<PsnTrophy>): PsnTrophy => ({
  id: 0, name: 'Name', detail: 'Detail', iconUrl: 'https://i.png', type: 'bronze',
  hidden: false, earned: false, earnedAt: null, rarity: null, ...overrides,
})

const TROPHIES = [
  trophy({ id: 0, name: 'All of them', type: 'platinum', earned: true, earnedAt: '2026-01-02T00:00:00Z', rarity: 3.4 }),
  trophy({ id: 1, name: 'Spoiler', detail: 'The ending', hidden: true }),
]

const toggle = jest.fn()
beforeEach(() => {
  jest.clearAllMocks()
  ;(usePsnFavoriteTrophies as jest.Mock).mockReturnValue({ pinned: new Set<number>(), toggle, canPin: false })
})

const counts = (bronze: number) => ({ bronze, silver: 0, gold: 0, platinum: 0 })
const GROUPS = [
  { id: 'default', name: 'Base', iconUrl: null, defined: counts(1), earned: counts(1), progress: 100 },
  { id: '001', name: 'Winter Wonder', iconUrl: null, defined: counts(1), earned: counts(0), progress: 0 },
]
const WITH_DLC = [trophy({ id: 0, name: 'Base one', groupId: 'default' }), trophy({ id: 1, name: 'DLC one', groupId: '001' })]

test('each trophy links to its row on the game page, saying its grade and state', () => {
  render(<PsnTrophyGrid gameId={2018800} trophies={TROPHIES} />)
  const earned = screen.getByRole('link', { name: `All of them — ${en.psn.platinum}, ${en.psn.earned}` })
  expect(earned).toHaveAttribute('href', '/psnGame/NPWR20188_00#trophy-0')
  // A hidden trophy keeps its name secret until earned.
  expect(screen.getByRole('link', { name: `${en.psn.hiddenTrophy} — ${en.psn.bronze}, ${en.psn.locked}` })).toBeInTheDocument()
  expect(screen.queryByText('Spoiler')).not.toBeInTheDocument()
})

test('focusing a trophy shows its details at once', () => {
  render(<PsnTrophyGrid gameId={100} trophies={TROPHIES} />)
  jest.useFakeTimers()
  fireEvent.focus(screen.getAllByRole('link')[0])
  act(() => jest.runAllTimers())
  jest.useRealTimers()
  const tip = screen.getByRole('tooltip')
  expect(tip).toHaveTextContent('All of them')
  expect(tip).toHaveTextContent(en.psn.platinum)
  expect(tip).toHaveTextContent('3.4')
  fireEvent.blur(screen.getAllByRole('link')[0])
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
})

test('a long set shows the first few until asked for the rest', () => {
  const many = Array.from({ length: 20 }, (_, i) => trophy({ id: i, name: `T${i}` }))
  render(<PsnTrophyGrid gameId={100} trophies={many} limit={5} />)
  expect(screen.getAllByRole('link')).toHaveLength(5)
})

test('with DLC, each group is a fold with its progress: all closed', () => {
  const { container } = render(<PsnTrophyGrid gameId={100} gameTitle="Astro Bot" trophies={WITH_DLC} groups={GROUPS} />)
  const folds = container.querySelectorAll('details')
  expect(folds).toHaveLength(2)
  expect(folds[0].querySelector('summary')).toHaveTextContent(`${en.psn.baseGame}0/1`)
  expect(folds[0]).not.toHaveAttribute('open')
  expect(folds[1].querySelector('summary')).toHaveTextContent('Winter Wonder0/1')
  expect(folds[1]).not.toHaveAttribute('open')
  expect(folds[1].querySelectorAll('a')).toHaveLength(1)
})

test('without DLC, no folds', () => {
  const { container } = render(<PsnTrophyGrid gameId={100} gameTitle="Astro Bot" trophies={TROPHIES} groups={[GROUPS[0]]} />)
  expect(container.querySelector('details')).toBeNull()
})

test('signed in, a star pins a trophy; no star when signed out', () => {
  const { unmount } = render(<PsnTrophyGrid gameId={100} gameTitle="Astro Bot" trophies={TROPHIES} />)
  expect(screen.queryByRole('switch', { name: new RegExp(en.favorites.addFavorite) })).not.toBeInTheDocument()
  unmount()
  ;(usePsnFavoriteTrophies as jest.Mock).mockReturnValue({ pinned: new Set([0]), toggle, canPin: true })
  render(<PsnTrophyGrid gameId={100} gameTitle="Astro Bot" trophies={TROPHIES} />)
  expect(usePsnFavoriteTrophies).toHaveBeenCalledWith(100, 'Astro Bot')
  expect(screen.getByRole('switch', { name: `${en.favorites.removeFavorite}: All of them` })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('switch', { name: `${en.favorites.addFavorite}: ${en.psn.hiddenTrophy}` }))
  expect(toggle).toHaveBeenCalledWith(TROPHIES[1])
})
