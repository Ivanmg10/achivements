jest.mock('@/context/PinnedGamesContext', () => ({ usePinnedGames: jest.fn() }))
jest.mock('@/hooks/useProfileLibrary', () => ({ useProfileLibrary: jest.fn() }))
jest.mock('@/lib/notify', () => ({ notify: { error: jest.fn() } }))
jest.mock('../main-page-pinned-section-sortable/MainPagePinnedSectionSortable', () => ({
  __esModule: true,
  default: ({ items, renderItem, onReorder }: { items: unknown[]; renderItem: (i: unknown, h: null) => React.ReactNode; onReorder: (n: unknown[]) => void }) => (
    <div>
      {items.map((i, n) => <div key={n}>{renderItem(i, null)}</div>)}
      <button onClick={() => onReorder([...items].reverse())}>reverse</button>
    </div>
  ),
}))
jest.mock('../main-page-pinned-section-game-tile/MainPagePinnedSectionGameTile', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="game">{game.title}</div>,
}))

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { notify } from '@/lib/notify'
import MainPagePinnedSectionGames from './MainPagePinnedSectionGames'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { en } from '@/translations/en'

const game = (source: string, id: number, title: string) => ({ key: `${source}:${id}`, source, id, title, subtitle: '', status: 'playing', pct: 50, href: '/x' })

beforeEach(() => {
  ;(useProfileLibrary as jest.Mock).mockReturnValue({ games: [game('ra', 1, 'Colosseum'), game('psn', 2, 'BO2'), game('steam', 1, 'Portal')], isLoading: false })
})

test('the pinned games in their saved order; a pin no library lists is left out', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [{ source: 'psn', id: 2 }, { source: 'ra', id: 1 }, { source: 'xbox', id: 9 }], isLoading: false })
  render(<MainPagePinnedSectionGames />)
  expect(screen.getByText(en.pinnedGames.title)).toBeInTheDocument()
  expect(screen.getAllByTestId('game').map((g) => g.textContent)).toEqual(['BO2', 'Colosseum'])
})

test('nothing pinned says where to pin', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [], isLoading: false })
  render(<MainPagePinnedSectionGames />)
  expect(screen.getByText(en.pinnedGames.emptyTitle)).toBeInTheDocument()
})

test('placeholders until the pins and the libraries are in', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [], isLoading: true })
  const { container } = render(<MainPagePinnedSectionGames />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})

test('a new order is saved for every pin, the ones not shown kept after', async () => {
  const reorder = jest.fn().mockResolvedValue(undefined)
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [{ source: 'psn', id: 2 }, { source: 'xbox', id: 9 }, { source: 'ra', id: 1 }], isLoading: false, reorder })
  render(<MainPagePinnedSectionGames />)
  fireEvent.click(screen.getByText('reverse'))
  await waitFor(() => expect(reorder).toHaveBeenCalledWith([{ source: 'ra', id: 1 }, { source: 'psn', id: 2 }, { source: 'xbox', id: 9 }]))
})

test('an order that could not be saved says so', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const reorder = jest.fn().mockRejectedValue(new Error('down'))
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [{ source: 'psn', id: 2 }, { source: 'ra', id: 1 }], isLoading: false, reorder })
  render(<MainPagePinnedSectionGames />)
  fireEvent.click(screen.getByText('reverse'))
  await waitFor(() => expect(notify.error).toHaveBeenCalledWith(en.toast.orderFailed))
})
