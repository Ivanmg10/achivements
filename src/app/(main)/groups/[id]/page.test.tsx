jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '5' }),
  useRouter: () => ({ push: jest.fn() }),
}))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
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
jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))
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

import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { notify } from '@/lib/notify'
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

function json(body: unknown, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) })
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

test('asks the server once for the release years it does not have yet', async () => {
  render(<GroupDetailPage />)
  await screen.findByText('ra-item Zelda')
  const urls = (global.fetch as jest.Mock).mock.calls.map(([u]) => u)
  expect(urls.filter((u: string) => u === '/api/groups/5/years')).toHaveLength(1)
  expect(urls.some((u: string) => u.startsWith('/api/getGameData'))).toBe(false)
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

test('the decade filter shows once a year is known, for Steam games too', async () => {
  ;(global.fetch as jest.Mock).mockImplementation((url: string) =>
    url === '/api/groups/5'
      ? json(GROUP)
      : url === '/api/groups/5/years'
        ? json({ years: [{ id: 1, release_year: 1998 }, { id: 2, release_year: 2011 }] })
        : json({}),
  )
  render(<GroupDetailPage />)
  const decade = await screen.findByRole('group', { name: en.groups.filterDecadeLabel })
  fireEvent.click(within(decade).getByRole('button', { name: "10's" }))
  expect(screen.getByText('steam-item Portal 2')).toBeInTheDocument()
  expect(screen.queryByText('ra-item Zelda')).not.toBeInTheDocument()
})

test('removing a game offers to undo it', async () => {
  render(<GroupDetailPage />)
  fireEvent.click(await screen.findByText('steam-item Portal 2'))
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.gameRemoved, expect.objectContaining({ action: expect.objectContaining({ label: en.toast.undo }) })))
})

test('undo puts the removed game back where it was', async () => {
  ;(global.fetch as jest.Mock).mockImplementation((url: string, init?: { method?: string }) =>
    url === '/api/groups/5'
      ? json(GROUP)
      : init?.method === 'POST' && url === '/api/groups/5/games'
        ? json({ ...item(9, 'steam', 620, 'Portal 2') }, true, 201)
        : json({}),
  )
  render(<GroupDetailPage />)
  fireEvent.click(await screen.findByText('steam-item Portal 2'))
  await waitFor(() => expect(notify.success).toHaveBeenCalled())
  const { action } = (notify.success as jest.Mock).mock.calls[0][1]
  await act(async () => { await action.onClick() })
  expect(await screen.findByText('steam-item Portal 2')).toBeInTheDocument()
  const post = (global.fetch as jest.Mock).mock.calls.find(([u, i]) => u === '/api/groups/5/games' && i?.method === 'POST')
  expect(JSON.parse(post[1].body)).toMatchObject({ source: 'steam', game_id: 620, title: 'Portal 2' })
  expect(notify.success).toHaveBeenCalledWith(en.toast.gameRestored)
})

test('a group that is gone or not yours says so, instead of leaving silently', async () => {
  ;(global.fetch as jest.Mock).mockImplementation(() => json({}, false, 404))
  render(<GroupDetailPage />)
  expect(await screen.findByRole('alert')).toHaveTextContent(en.groups.notFound)
})

test('a failed load can be retried', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(global.fetch as jest.Mock).mockImplementationOnce(() => json({}, false, 500))
  render(<GroupDetailPage />)
  expect(await screen.findByRole('alert')).toHaveTextContent(en.groups.loadError)
  fireEvent.click(screen.getByRole('button', { name: en.groups.retry }))
  expect(await screen.findByText('ra-item Zelda')).toBeInTheDocument()
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
