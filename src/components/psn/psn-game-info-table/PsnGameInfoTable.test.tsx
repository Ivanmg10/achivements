jest.mock('@/hooks/usePsnFavoriteTrophies', () => ({ usePsnFavoriteTrophies: jest.fn() }))

import { render, screen, fireEvent, within } from '@testing-library/react'
import PsnGameInfoTable from './PsnGameInfoTable'
import { en } from '@/translations/en'
import { usePsnFavoriteTrophies } from '@/hooks/usePsnFavoriteTrophies'
import type { PsnTrophy } from '@/types/psn'

const trophy = (overrides: Partial<PsnTrophy>): PsnTrophy => ({
  id: 0, name: 'Name', detail: 'Detail', iconUrl: 'https://i.png', type: 'bronze',
  hidden: false, earned: false, earnedAt: null, rarity: null, ...overrides,
})

const TROPHIES = [
  trophy({ id: 0, name: 'Platinum one', type: 'platinum', rarity: 2, earned: true, earnedAt: '2026-01-03T00:00:00Z' }),
  trophy({ id: 1, name: 'Common', rarity: 70, earned: true, earnedAt: '2026-01-01T00:00:00Z' }),
  trophy({ id: 2, name: 'Locked', rarity: 10 }),
  trophy({ id: 3, name: 'Spoiler', detail: 'The ending', hidden: true }),
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

/** The trophy names in the desktop table, in order. */
const names = () =>
  within(screen.getByRole('table'))
    .getAllByRole('heading', { level: 3 })
    .map((h) => h.textContent)

test('every trophy in game order, hidden ones kept secret', () => {
  render(<PsnGameInfoTable trophies={TROPHIES} />)
  expect(names()).toEqual(['Platinum one', 'Common', 'Locked', en.psn.hiddenTrophy])
  expect(screen.queryByText('The ending')).not.toBeInTheDocument()
  expect(screen.getAllByText(en.psn.locked).length).toBeGreaterThan(0)
})

const filter = (name: string) => within(screen.getByRole('group')).getByRole('button', { name })
const column = (name: string) => within(screen.getByRole('table')).getByRole('button', { name })

test('filters earned and unearned', () => {
  render(<PsnGameInfoTable trophies={TROPHIES} />)
  fireEvent.click(filter(en.gameInfoTable.filterEarned))
  expect(names()).toEqual(['Platinum one', 'Common'])
  fireEvent.click(filter(en.gameInfoTable.filterUnearned))
  expect(names()).toEqual(['Locked', en.psn.hiddenTrophy])
})

test('sorts by rarity and by when earned, newest first, locked last', () => {
  render(<PsnGameInfoTable trophies={TROPHIES} />)
  fireEvent.click(column(en.gameInfoTable.headerRarity))
  expect(names()).toEqual(['Platinum one', 'Locked', 'Common', en.psn.hiddenTrophy])
  fireEvent.click(column(en.gameInfoTable.headerEarned))
  expect(names()).toEqual(['Platinum one', 'Common', 'Locked', en.psn.hiddenTrophy])
})

test('each row carries the anchor its links point at', () => {
  const { container } = render(<PsnGameInfoTable trophies={TROPHIES} />)
  expect(container.querySelector('#trophy-2')).toHaveTextContent('Locked')
})

test('with DLC, tabs pick a group; without, no tabs', () => {
  const { unmount } = render(<PsnGameInfoTable gameId={100} gameTitle="Astro Bot" trophies={WITH_DLC} groups={GROUPS} />)
  expect(names()).toEqual(['Base one', 'DLC one'])
  fireEvent.click(screen.getByRole('tab', { name: /Winter Wonder/ }))
  expect(names()).toEqual(['DLC one'])
  fireEvent.click(screen.getByRole('tab', { name: new RegExp(en.psn.baseGame) }))
  expect(names()).toEqual(['Base one'])
  unmount()
  render(<PsnGameInfoTable gameId={100} gameTitle="Astro Bot" trophies={TROPHIES} groups={[GROUPS[0]]} />)
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
})

test('signed in, each row can be pinned', () => {
  ;(usePsnFavoriteTrophies as jest.Mock).mockReturnValue({ pinned: new Set<number>(), toggle, canPin: true })
  render(<PsnGameInfoTable gameId={100} gameTitle="Astro Bot" trophies={TROPHIES} />)
  fireEvent.click(within(screen.getByRole('table')).getByRole('switch', { name: `${en.favorites.addFavorite}: Common` }))
  expect(toggle).toHaveBeenCalledWith(TROPHIES[1])
})
