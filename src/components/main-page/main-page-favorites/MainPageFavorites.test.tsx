jest.mock('@/hooks/usePinnedAchievements', () => ({ usePinnedAchievements: jest.fn() }))
jest.mock('@/components/achievement-modal/AchievementModal', () => ({
  __esModule: true,
  default: ({ onToggleFavorite, onClose }: { onToggleFavorite: () => void; onClose: () => void }) => (
    <div data-testid="ach-modal">
      <button onClick={onToggleFavorite}>modal-unpin</button>
      <button onClick={onClose}>modal-close</button>
    </div>
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageFavorites from './MainPageFavorites'
import { usePinnedAchievements } from '@/hooks/usePinnedAchievements'
import { en } from '@/translations/en'

const RA = {
  source: 'ra', achievement_id: 5, game_id: 1, game_title: 'Zelda', num_distinct_players: 3,
  snapshot: { Title: 'Triforce', BadgeName: '123', Points: 25, DateEarned: '2024-01-01' },
}
const STEAM = {
  source: 'steam', steam_apiname: 'WIN', game_id: 620, game_title: 'Portal 2', num_distinct_players: 0,
  snapshot: { title: 'Win', badgeUrl: 'https://cdn/win.jpg', earned: true, hidden: false, globalPct: 12.34 },
}

const mockUnpin = jest.fn()
function state(over: Partial<{ pinned: unknown[]; isLoading: boolean }> = {}) {
  ;(usePinnedAchievements as jest.Mock).mockReturnValue({ pinned: [], isLoading: false, unpin: mockUnpin, ...over })
}

beforeEach(() => {
  jest.clearAllMocks()
  state()
})

test('loads the pins of both platforms, whatever platform is selected', () => {
  render(<MainPageFavorites />)
  expect(usePinnedAchievements).toHaveBeenCalledWith()
})

test('shows a skeleton while loading', () => {
  state({ isLoading: true })
  const { container } = render(<MainPageFavorites />)
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
})

test('shows the empty state without pins', () => {
  render(<MainPageFavorites />)
  expect(screen.getByText(en.favorites.emptyTitle)).toBeInTheDocument()
})

test('renders RA and Steam pins with their own rows', () => {
  state({ pinned: [RA, STEAM] })
  render(<MainPageFavorites />)
  expect(screen.getByText('Triforce')).toBeInTheDocument()
  expect(screen.getByText('Win')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Win/ }).getAttribute('href')).toBe('/steamGame/620#ach-WIN')
})

test('an RA pin opens its detail modal, which can unpin it', () => {
  state({ pinned: [RA] })
  render(<MainPageFavorites />)
  fireEvent.click(screen.getByText('Triforce'))
  expect(screen.getByTestId('ach-modal')).toBeInTheDocument()
  fireEvent.click(screen.getByText('modal-unpin'))
  expect(mockUnpin).toHaveBeenCalledWith(RA)
  expect(screen.queryByTestId('ach-modal')).not.toBeInTheDocument()
})

test('closing the modal keeps the pin', () => {
  state({ pinned: [RA] })
  render(<MainPageFavorites />)
  fireEvent.click(screen.getByText('Triforce'))
  fireEvent.click(screen.getByText('modal-close'))
  expect(screen.queryByTestId('ach-modal')).not.toBeInTheDocument()
  expect(mockUnpin).not.toHaveBeenCalled()
})

test('the star unpins a Steam pin', () => {
  state({ pinned: [STEAM] })
  render(<MainPageFavorites />)
  fireEvent.click(screen.getByRole('button', { name: en.favorites.removeFavorite }))
  expect(mockUnpin).toHaveBeenCalledWith(STEAM)
})

test('counts the pins and lays a long list out in columns, with no inner scroll', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({ ...RA, achievement_id: i, snapshot: { ...RA.snapshot, Title: `Pin ${i}` } }))
  state({ pinned: many })
  const { container } = render(<MainPageFavorites />)
  expect(screen.getByText('20')).toBeInTheDocument()
  expect(screen.getAllByText(/^Pin \d+$/)).toHaveLength(20)
  expect(container.querySelector('.overflow-y-auto')).toBeNull()
  expect(container.querySelector('[class*="xl:grid-cols-3"]')).not.toBeNull()
})
