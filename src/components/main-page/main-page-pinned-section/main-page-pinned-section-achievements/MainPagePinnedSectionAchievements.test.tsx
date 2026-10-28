jest.mock('@/hooks/usePinnedAchievements', () => ({ usePinnedAchievements: jest.fn() }))
jest.mock('@/components/achievement-modal/AchievementModal', () => ({
  __esModule: true,
  default: ({ achievement }: { achievement: { Title: string } }) => <div data-testid="modal">{achievement.Title}</div>,
}))
jest.mock('../main-page-pinned-section-sortable/MainPagePinnedSectionSortable', () => ({
  __esModule: true,
  default: ({ items, renderItem, onReorder }: { items: unknown[]; renderItem: (i: unknown, h: null) => React.ReactNode; onReorder: (n: unknown[]) => void }) => (
    <div>
      {items.map((i, n) => <div key={n}>{renderItem(i, null)}</div>)}
      <button onClick={() => onReorder([...items].reverse())}>reverse</button>
    </div>
  ),
}))
jest.mock('../main-page-pinned-section-achievement-tile/MainPagePinnedSectionAchievementTile', () => ({
  __esModule: true,
  default: ({ view, onOpen, onUnpin }: { view: { title: string }; onOpen?: () => void; onUnpin: () => void }) => (
    <div data-testid="tile">
      <button onClick={onOpen}>{`open ${view.title}`}</button>
      <button onClick={onUnpin}>{`unpin ${view.title}`}</button>
    </div>
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import MainPagePinnedSectionAchievements from './MainPagePinnedSectionAchievements'
import { usePinnedAchievements } from '@/hooks/usePinnedAchievements'
import { en } from '@/translations/en'

const RA = { source: 'ra', achievement_id: 1, game_id: 7, game_title: 'G', num_distinct_players: 0, snapshot: { Title: 'Win', Description: '', BadgeName: '', Points: 5, NumAwarded: 0, DateEarned: '2026-01-01' } }
const STEAM = { source: 'steam', steam_apiname: 'A', game_id: 620, game_title: 'P2', num_distinct_players: 0, snapshot: { title: 'Lock', description: '', badgeUrl: '', earned: false, hidden: false, globalPct: null } }
const unpin = jest.fn()
const reorder = jest.fn()

function setPins(over: Record<string, unknown> = {}) {
  ;(usePinnedAchievements as jest.Mock).mockReturnValue({ pinned: [RA, STEAM], isLoading: false, error: false, refetch: jest.fn(), unpin, reorder, ...over })
}

beforeEach(() => jest.clearAllMocks())

test('the title, how many are earned, and a tile per pin', () => {
  setPins()
  render(<MainPagePinnedSectionAchievements />)
  expect(screen.getByRole('heading', { name: en.favorites.title })).toBeInTheDocument()
  expect(screen.getByText(en.favorites.progress.replace('{n}', '1').replace('{total}', '2'))).toBeInTheDocument()
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  expect(screen.getAllByTestId('tile')).toHaveLength(2)
})

test('an RA pin opens its modal; any pin can be unpinned', () => {
  setPins()
  render(<MainPagePinnedSectionAchievements />)
  fireEvent.click(screen.getByText('open Win'))
  expect(screen.getByTestId('modal')).toHaveTextContent('Win')
  fireEvent.click(screen.getByText('unpin Lock'))
  expect(unpin).toHaveBeenCalledWith(STEAM)
})

test('nothing pinned yet says how to pin', () => {
  setPins({ pinned: [] })
  render(<MainPagePinnedSectionAchievements />)
  expect(screen.getByText(en.favorites.emptyTitle)).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('placeholders while loading', () => {
  setPins({ pinned: [], isLoading: true })
  const { container } = render(<MainPagePinnedSectionAchievements />)
  expect(container.querySelector('[aria-busy="true"]')).toHaveClass('auto-rows-40')
  expect(container.querySelector('[aria-busy="true"] > div')).toHaveClass('h-full')
})

test('a new order is saved as the pins themselves', () => {
  setPins()
  render(<MainPagePinnedSectionAchievements />)
  fireEvent.click(screen.getByText('reverse'))
  expect(reorder).toHaveBeenCalledWith([STEAM, RA])
})
