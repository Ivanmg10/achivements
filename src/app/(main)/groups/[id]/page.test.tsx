jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '5' }),
  useRouter: () => ({ push: jest.fn() }),
}))
jest.mock('@/hooks/useGroups', () => ({ useGroups: () => ({ updateGroup: jest.fn(), deleteGroup: jest.fn() }) }))
jest.mock('@/context/GamesDataContext', () => ({ useGamesData: () => ({ all: [] }) }))
jest.mock('@/hooks/useRecentlyPlayedGames', () => ({ useRecentlyPlayedGames: () => ({ games: [] }) }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/components/groups/GroupModal', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/groups/add-game-modal/AddGameModal', () => ({
  __esModule: true,
  default: ({ existingKeys }: { existingKeys: Set<string> }) => (
    <div data-testid="add-modal">{Array.from(existingKeys).join(',')}</div>
  ),
}))
jest.mock('@/components/groups/delete-confirm-dialog/DeleteConfirmDialog', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/groups/group-icon-display/GroupIconDisplay', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/status-grid-control/StatusGridControl', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/groups/sortable-item/SortableItem', () => ({
  __esModule: true,
  default: ({ item, onRemove }: { item: { id: number; title: string }; onRemove: (id: number) => void }) => (
    <button onClick={() => onRemove(item.id)}>ra-item {item.title}</button>
  ),
}))
jest.mock('@/components/groups/steam-sortable-item/SteamSortableItem', () => ({
  __esModule: true,
  default: ({ item, onRemove }: { item: { id: number; title: string }; onRemove: (id: number) => void }) => (
    <button onClick={() => onRemove(item.id)}>steam-item {item.title}</button>
  ),
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GroupDetailPage from './page'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { en } from '@/translations/en'

function item(id: number, source: 'ra' | 'steam' | undefined, gameId: number, title: string, pct = '0') {
  return {
    id, source, game_id: gameId, title, image_icon: null, console_name: source === 'steam' ? 'Steam' : 'SNES',
    pct_won: pct, num_awarded: 0, max_possible: 10, points_won: 0, max_points: 0, position: id, added_at: '2026-01-01',
  }
}

const GROUP = {
  id: 5, title: 'Mix', description: null, icon: null, is_public: false,
  items: [item(1, undefined, 620, 'Zelda'), item(2, 'steam', 620, 'Portal 2')],
}

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [] })
  global.fetch = jest.fn((url: string) => (url === '/api/groups/5' ? json(GROUP) : json({}))) as unknown as typeof fetch
})

test('renders RA and Steam items with their own cards, even with the same game id', async () => {
  render(<GroupDetailPage />)
  expect(await screen.findByText('ra-item Zelda')).toBeInTheDocument()
  expect(screen.getByText('steam-item Portal 2')).toBeInTheDocument()
  expect(screen.getByTestId('add-modal')).toHaveTextContent('ra:620,steam:620')
})

test('looks up release years for RA items only', async () => {
  render(<GroupDetailPage />)
  await screen.findByText('ra-item Zelda')
  const urls = (global.fetch as jest.Mock).mock.calls.map(([u]) => u)
  expect(urls.filter((u: string) => u.startsWith('/api/getGameData'))).toEqual(['/api/getGameData?gameId=620'])
})

test('removing a Steam game deletes it by platform', async () => {
  render(<GroupDetailPage />)
  fireEvent.click(await screen.findByText('steam-item Portal 2'))
  await waitFor(() => expect(screen.queryByText('steam-item Portal 2')).not.toBeInTheDocument())
  expect(global.fetch).toHaveBeenCalledWith('/api/groups/5/games?gameId=620&source=steam', { method: 'DELETE' })
  expect(screen.getByText('ra-item Zelda')).toBeInTheDocument()
})

test('keeps the game when the delete fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(global.fetch as jest.Mock).mockImplementation((url: string, init?: { method?: string }) =>
    url === '/api/groups/5' ? json(GROUP) : init?.method === 'DELETE' ? json({}, false) : json({}),
  )
  render(<GroupDetailPage />)
  fireEvent.click(await screen.findByText('ra-item Zelda'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/groups/5/games?gameId=620&source=ra', { method: 'DELETE' }))
  expect(screen.getByText('ra-item Zelda')).toBeInTheDocument()
})

test('the completed filter uses live Steam progress', async () => {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({
    library: [{ id: 620, achievementsLoaded: true, maxPossible: 10, numAwarded: 10 }],
  })
  render(<GroupDetailPage />)
  await screen.findByText('ra-item Zelda')
  fireEvent.click(screen.getByRole('button', { name: en.groups.filter100 }))
  expect(screen.getByText('steam-item Portal 2')).toBeInTheDocument()
  expect(screen.queryByText('ra-item Zelda')).not.toBeInTheDocument()
})
