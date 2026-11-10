import { render, screen, fireEvent } from '@testing-library/react'
import PinnedGameRow from './PinnedGameRow'
import { useGameProgression } from '@/hooks/useGameProgression'

jest.mock('@/hooks/useGameProgression', () => ({
  useGameProgression: jest.fn(),
}))
jest.mock('@/context/PinnedGamesContext', () => ({
  usePinnedGames: () => ({ isPinned: () => true, pinGame: jest.fn(), unpinGame: jest.fn() }),
}))
jest.mock('@/components/recently-played-feed/ra-recently-played-expanded/RARecentlyPlayedExpanded', () => ({
  RARecentlyPlayedExpanded: ({ achievements }: { achievements: unknown[] }) => (
    <div data-testid="achievement-grid">{achievements.length} achievements</div>
  ),
}))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: null, transition: null, isDragging: false }),
}))
jest.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }))

// What every platform's row does is in PinnedGameCard.contract.test.tsx; this is RA's own.
const game = {
  ID: 10,
  Title: 'Sly Cooper',
  ImageIcon: '/icon.png',
  ConsoleID: 21,
  ConsoleName: 'PlayStation 2',
  NumAchievements: 40,
  NumAwardedToUser: 20,
  NumAwardedToUserHardcore: 5,
  NumDistinctPlayers: 100,
  Achievements: {
    2: { ID: 2, DisplayOrder: 1 },
    1: { ID: 1, DisplayOrder: 0 },
  },
} as never

test('the bar shows the softcore share with the hardcore one over it, and the console is named', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game, isLoading: false })
  const { container } = render(<PinnedGameRow gameId={10} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByRole('progressbar', { name: 'Sly Cooper' })).toHaveAttribute('aria-valuenow', '50')
  expect(container.querySelector('[data-fill="main"]')).toHaveStyle({ width: '12.5%' })
  expect(container.querySelector('[data-fill="soft"]')).toHaveStyle({ width: '50%' })
  expect(screen.getByText('PlayStation 2')).toBeInTheDocument()
  expect(screen.getByText(/20\/40/)).toBeInTheDocument()
})

test('a game with no achievements shows no bar and no count', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game: { ...(game as object), NumAchievements: 0 }, isLoading: false })
  render(<PinnedGameRow gameId={10} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(screen.queryByText(/\/0/)).not.toBeInTheDocument()
})

test('a failed read says so and can be retried', () => {
  const refetch = jest.fn()
  ;(useGameProgression as jest.Mock).mockReturnValue({ game: null, isLoading: false, error: 'failed', refetch })
  render(<PinnedGameRow gameId={10} isOpen={false} onToggle={jest.fn()} />)
  fireEvent.click(screen.getByRole('button'))
  expect(refetch).toHaveBeenCalled()
})

test('opens the achievements in their order', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game, isLoading: false })
  render(<PinnedGameRow gameId={10} isOpen onToggle={jest.fn()} />)
  expect(screen.getByTestId('achievement-grid')).toHaveTextContent('2 achievements')
})
