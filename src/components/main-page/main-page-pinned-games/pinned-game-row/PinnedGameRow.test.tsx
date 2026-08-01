import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PinnedGameRow from './PinnedGameRow'
import { useGameProgression } from '@/hooks/useGameProgression'

jest.mock('@/hooks/useGameProgression', () => ({
  useGameProgression: jest.fn(),
}))

jest.mock('@/context/PinnedGamesContext', () => ({
  usePinnedGames: () => ({ isPinned: () => true, pinGame: jest.fn(), unpinGame: jest.fn() }),
}))

jest.mock('@/components/ra-recently-played/ra-recently-played-expanded/RARecentlyPlayedExpanded', () => ({
  RARecentlyPlayedExpanded: ({ achievements }: { achievements: unknown[] }) => (
    <div data-testid="achievement-grid">{achievements.length} achievements</div>
  ),
}))

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

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
    1: { ID: 1, DisplayOrder: 0 },
    2: { ID: 2, DisplayOrder: 1 },
  },
} as any

// Uncontrolled wrapper so tests can exercise open/close via clicks like before.
function UncontrolledPinnedGameRow({ gameId }: { gameId: number }) {
  const [isOpen, setIsOpen] = useState(false)
  return <PinnedGameRow gameId={gameId} isOpen={isOpen} onToggle={() => setIsOpen((o) => !o)} />
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('renders a skeleton while loading', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game: null, isLoading: true })
  const { container } = render(<UncontrolledPinnedGameRow gameId={10} />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  expect(screen.queryByText('Sly Cooper')).not.toBeInTheDocument()
})

test('renders the game title, console and achievement count once loaded', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game, isLoading: false })
  render(<UncontrolledPinnedGameRow gameId={10} />)
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
  expect(screen.getByText('PlayStation 2')).toBeInTheDocument()
  expect(screen.getByText(/20\/40/)).toBeInTheDocument()
})

test('expands to show the achievement grid on click, and collapses again', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game, isLoading: false })
  render(<UncontrolledPinnedGameRow gameId={10} />)
  expect(screen.queryByTestId('achievement-grid')).not.toBeInTheDocument()

  fireEvent.click(screen.getByText('Sly Cooper').closest('[role="button"]')!)
  expect(screen.getByTestId('achievement-grid')).toHaveTextContent('2 achievements')

  fireEvent.click(screen.getByText('Sly Cooper').closest('[role="button"]')!)
  expect(screen.queryByTestId('achievement-grid')).not.toBeInTheDocument()
})

test('has an accessible drag handle', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game, isLoading: false })
  render(<UncontrolledPinnedGameRow gameId={10} />)
  expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
})

test('clicking the pin toggle does not expand the row', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game, isLoading: false })
  render(<UncontrolledPinnedGameRow gameId={10} />)
  fireEvent.click(screen.getByRole('button', { name: 'Unpin game' }))
  expect(screen.queryByTestId('achievement-grid')).not.toBeInTheDocument()
})
