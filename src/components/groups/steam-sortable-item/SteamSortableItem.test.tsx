import { render, screen, fireEvent } from '@testing-library/react'
import SteamSortableItem from './SteamSortableItem'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSortable } from '@dnd-kit/sortable'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { GameGroupItem } from '@/types/types'

jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: jest.fn(() => ({
    attributes: {}, listeners: {}, setNodeRef: jest.fn(), transform: null, transition: undefined, isDragging: false,
  })),
}))
jest.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }))
jest.mock('@/components/steam/steam-game-item/steam-game-item-achievements/SteamGameItemAchievements', () => ({
  __esModule: true,
  default: ({ appId, expectedCount }: { appId: number; expectedCount?: number }) => (
    <div data-testid="achievements">{appId}:{String(expectedCount)}</div>
  ),
}))

const ITEM: GameGroupItem = {
  id: 42, source: 'steam', game_id: 620, title: 'Portal 2', image_icon: 'https://cdn/icon.jpg', console_name: 'Steam',
  pct_won: '0.2', num_awarded: 10, max_possible: 50, points_won: 0, max_points: 0, position: 0,
  added_at: new Date().toISOString(),
}

const PORTAL = {
  ...toSteamGameProgress({ appid: 620, name: 'Portal 2', playtime_forever: 120, has_community_visible_stats: true }),
  achievementsLoaded: true, maxPossible: 51, numAwarded: 51, pctWon: 100,
}

function setLibrary(library: unknown[] = [PORTAL]) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library, recent: [] })
}

beforeEach(() => {
  jest.clearAllMocks()
  setLibrary()
})

test('sorts by its row id, like RA items', () => {
  render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(useSortable).toHaveBeenCalledWith({ id: 42, disabled: false })
})

test('links to the Steam game page and shows live progress from the library', () => {
  render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByRole('link', { name: 'Portal 2' }).getAttribute('href')).toBe('/steamGame/620')
  expect(screen.getByText(`51 / 51 ${en.steam.achievements}`)).toBeInTheDocument()
  expect(screen.getByText(`★ ${en.steam.perfect}`)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Portal 2' }).getAttribute('aria-valuenow')).toBe('100')
  expect(screen.getByText(`${en.steam.playtime} · 2 h`, { exact: false })).toBeInTheDocument()
})

test('falls back to the counts stored with the item when the library lacks the game', () => {
  setLibrary([])
  render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(`10 / 50 ${en.steam.achievements}`)).toBeInTheDocument()
  expect(screen.queryByText(`★ ${en.steam.perfect}`)).not.toBeInTheDocument()
  expect(screen.getByText(`${en.steam.lastPlayed} · ${en.steam.neverPlayed}`, { exact: false })).toBeInTheDocument()
})

test('says progress is unknown when nothing is known yet', () => {
  setLibrary([])
  render(<SteamSortableItem item={{ ...ITEM, num_awarded: 0, max_possible: 0 }} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(en.steam.progressUnknown)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('has a labelled drag handle only when draggable', () => {
  const { rerender } = render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByRole('button', { name: en.cards.dragToReorder })).toBeInTheDocument()
  rerender(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable={false} />)
  expect(screen.queryByRole('button', { name: en.cards.dragToReorder })).not.toBeInTheDocument()
})

test('removes by row id', () => {
  const onRemove = jest.fn()
  render(<SteamSortableItem item={ITEM} onRemove={onRemove} draggable />)
  fireEvent.click(screen.getByRole('button', { name: `${en.groups.removeGame} Portal 2` }))
  expect(onRemove).toHaveBeenCalledWith(42)
})

test('expands into the badge grid and collapses again', () => {
  render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  const expand = screen.getByRole('button', { name: `${en.steam.showAchievements}: Portal 2` })
  expect(expand.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(expand)
  expect(screen.getByTestId('achievements')).toHaveTextContent('620:51')
  fireEvent.click(screen.getByRole('button', { name: `${en.steam.hideAchievements}: Portal 2` }))
  expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
})

test('a game without stats says so instead of loading badges', () => {
  setLibrary([{ ...PORTAL, hasStats: false, achievementsLoaded: false, maxPossible: 0 }])
  render(<SteamSortableItem item={{ ...ITEM, max_possible: 0, num_awarded: 0 }} onRemove={jest.fn()} draggable />)
  fireEvent.click(screen.getByRole('button', { name: /achievements: Portal 2/ }))
  expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
  expect(screen.getAllByText(en.steam.noAchievements)).toHaveLength(2)
})
