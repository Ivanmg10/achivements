jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: undefined, isDragging: false }),
}))
jest.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }))
jest.mock('@/components/steam/steam-game-item-achievements/SteamGameItemAchievements', () => ({
  __esModule: true,
  default: ({ appId, expectedCount }: { appId: number; expectedCount?: number }) => (
    <div data-testid="achievements">{appId}:{String(expectedCount)}</div>
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import SteamSortableItem from './SteamSortableItem'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { GameGroupItem } from '@/types/types'

const ITEM: GameGroupItem = {
  id: 42, source: 'steam', game_id: 620, title: 'Portal 2', image_icon: 'https://cdn/icon.jpg', console_name: 'Steam',
  pct_won: '0.2', num_awarded: 10, max_possible: 50, points_won: 0, max_points: 0, position: 0,
  added_at: new Date().toISOString(),
}

const PORTAL = {
  ...toSteamGameProgress({ appid: 620, name: 'Portal 2', playtime_forever: 120, has_community_visible_stats: true }),
  achievementsLoaded: true, maxPossible: 51, numAwarded: 51, pctWon: 100,
}

function setLibrary(library: unknown[] = [PORTAL], recent: unknown[] = []) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library, recent })
}

beforeEach(() => setLibrary())

test('shows live progress and play time from the library, and marks a perfect game', () => {
  render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(`51 / 51 ${en.steam.achievements}`)).toBeInTheDocument()
  expect(screen.getByText(en.steam.perfect, { exact: false })).toBeInTheDocument()
  expect(screen.getByText(`${en.steam.playtime} · 2 h`)).toBeInTheDocument()
})

test('finds the game among the recent ones while the whole library is still loading', () => {
  setLibrary([], [PORTAL])
  render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(`51 / 51 ${en.steam.achievements}`)).toBeInTheDocument()
})

test('falls back to the counts stored with the item when the library lacks the game', () => {
  setLibrary([])
  render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(`10 / 50 ${en.steam.achievements}`)).toBeInTheDocument()
  expect(screen.queryByText(en.steam.perfect, { exact: false })).not.toBeInTheDocument()
})

test('says progress is unknown when nothing is known yet', () => {
  setLibrary([])
  render(<SteamSortableItem item={{ ...ITEM, num_awarded: 0, max_possible: 0 }} onRemove={jest.fn()} draggable />)
  expect(screen.getByText(en.steam.progressUnknown)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('opens into the badge grid with the total it expects', () => {
  render(<SteamSortableItem item={ITEM} onRemove={jest.fn()} draggable />)
  fireEvent.click(screen.getByRole('button', { name: `${en.cards.showAchievements}: Portal 2` }))
  expect(screen.getByTestId('achievements')).toHaveTextContent('620:51')
})

test('a game without stats says so instead of loading badges', () => {
  setLibrary([{ ...PORTAL, hasStats: false, achievementsLoaded: false, maxPossible: 0 }])
  render(<SteamSortableItem item={{ ...ITEM, max_possible: 0, num_awarded: 0 }} onRemove={jest.fn()} draggable />)
  fireEvent.click(screen.getByRole('button', { name: /achievements: Portal 2/ }))
  expect(screen.queryByTestId('achievements')).not.toBeInTheDocument()
  expect(screen.getAllByText(en.steam.noAchievements)).toHaveLength(2)
})
