import { render, screen, fireEvent } from '@testing-library/react'
import MainPagePinnedGames from './MainPagePinnedGames'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useMainView } from '@/context/MainViewContext'

jest.mock('@/context/PinnedGamesContext', () => ({
  usePinnedGames: jest.fn(),
}))

jest.mock('@/context/MainViewContext', () => ({
  useMainView: jest.fn(),
}))

jest.mock('./pinned-game-row/PinnedGameRow', () => ({
  __esModule: true,
  default: ({
    gameId,
    isOpen,
    onToggle,
  }: {
    gameId: number
    isOpen: boolean
    onToggle: () => void
  }) => (
    <button data-testid={`row-${gameId}`} onClick={onToggle}>
      {gameId} {isOpen ? 'open' : 'closed'}
    </button>
  ),
}))

jest.mock('./pin-game-card/PinGameCard', () => ({
  __esModule: true,
  default: () => <div data-testid="pin-game-card">+</div>,
}))

let capturedOnDragEnd: ((event: unknown) => void | Promise<void>) | null = null

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode
    onDragEnd: (event: unknown) => void | Promise<void>
  }) => {
    capturedOnDragEnd = onDragEnd
    return <>{children}</>
  },
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
}))

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: jest.fn((list, from, to) => {
    const next = [...list]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    return next
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: jest.fn(),
  rectSortingStrategy: jest.fn(),
}))

const setView = jest.fn()
const reorder = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  capturedOnDragEnd = null
  ;(useMainView as jest.Mock).mockReturnValue({ setView })
  reorder.mockResolvedValue(undefined)
})

test('shows a loading skeleton while pinned games are loading', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pinnedIds: [], isLoading: true, reorder })
  const { container } = render(<MainPagePinnedGames />)
  expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
})

test('shows only the "+" card when nothing is pinned', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pinnedIds: [], isLoading: false, reorder })
  render(<MainPagePinnedGames />)
  expect(screen.getByTestId('pin-game-card')).toBeInTheDocument()
})

test('renders one row per pinned game plus the "+" card', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pinnedIds: [10, 20], isLoading: false, reorder })
  render(<MainPagePinnedGames />)
  expect(screen.getByTestId('row-10')).toBeInTheDocument()
  expect(screen.getByTestId('row-20')).toBeInTheDocument()
  expect(screen.getByTestId('pin-game-card')).toBeInTheDocument()
})

test('expanding a row hides the other rows and the "+" card', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pinnedIds: [10, 20], isLoading: false, reorder })
  render(<MainPagePinnedGames />)

  fireEvent.click(screen.getByTestId('row-10'))

  expect(screen.getByTestId('row-10')).toHaveTextContent('open')
  expect(screen.queryByTestId('row-20')).not.toBeInTheDocument()
  expect(screen.queryByTestId('pin-game-card')).not.toBeInTheDocument()
})

test('clicking an expanded row again collapses it back to the full grid', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pinnedIds: [10, 20], isLoading: false, reorder })
  render(<MainPagePinnedGames />)

  fireEvent.click(screen.getByTestId('row-10'))
  fireEvent.click(screen.getByTestId('row-10'))

  expect(screen.getByTestId('row-10')).toHaveTextContent('closed')
  expect(screen.getByTestId('row-20')).toBeInTheDocument()
  expect(screen.getByTestId('pin-game-card')).toBeInTheDocument()
})

test('switches back to the recently played view', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pinnedIds: [], isLoading: false, reorder })
  render(<MainPagePinnedGames />)
  fireEvent.click(screen.getByRole('tab', { name: 'View recently played' }))
  expect(setView).toHaveBeenCalledWith('recent')
})

test('reorders the pinned games on drag end', async () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pinnedIds: [10, 20, 30], isLoading: false, reorder })
  render(<MainPagePinnedGames />)

  expect(capturedOnDragEnd).not.toBeNull()
  await capturedOnDragEnd!({ active: { id: 10 }, over: { id: 30 } })

  expect(reorder).toHaveBeenCalledWith([20, 30, 10])
})

test('ignores drag end when dropped on itself or outside a droppable', async () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pinnedIds: [10, 20], isLoading: false, reorder })
  render(<MainPagePinnedGames />)

  await capturedOnDragEnd!({ active: { id: 10 }, over: { id: 10 } })
  await capturedOnDragEnd!({ active: { id: 10 }, over: null })

  expect(reorder).not.toHaveBeenCalled()
})
