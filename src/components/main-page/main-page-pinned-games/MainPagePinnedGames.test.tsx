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

jest.mock('./steam-pinned-game-row/SteamPinnedGameRow', () => ({
  __esModule: true,
  default: ({ appId, isOpen, onToggle }: { appId: number; isOpen: boolean; onToggle: () => void }) => (
    <button data-testid={`steam-row-${appId}`} onClick={onToggle}>
      steam {appId} {isOpen ? 'open' : 'closed'}
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

function raPins(...ids: number[]) {
  return ids.map((id) => ({ source: 'ra' as const, id }))
}

beforeEach(() => {
  jest.clearAllMocks()
  capturedOnDragEnd = null
  ;(useMainView as jest.Mock).mockReturnValue({ setView })
  reorder.mockResolvedValue(undefined)
})

test('shows a loading skeleton while pinned games are loading', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: raPins(), isLoading: true, reorder })
  const { container } = render(<MainPagePinnedGames />)
  expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
})

test('shows only the "+" card when nothing is pinned', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: raPins(), isLoading: false, reorder })
  render(<MainPagePinnedGames />)
  expect(screen.getByTestId('pin-game-card')).toBeInTheDocument()
})

test('renders one row per pinned game plus the "+" card', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: raPins(10, 20), isLoading: false, reorder })
  render(<MainPagePinnedGames />)
  expect(screen.getByTestId('row-10')).toBeInTheDocument()
  expect(screen.getByTestId('row-20')).toBeInTheDocument()
  expect(screen.getByTestId('pin-game-card')).toBeInTheDocument()
})

test('expanding a row hides the other rows and the "+" card', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: raPins(10, 20), isLoading: false, reorder })
  render(<MainPagePinnedGames />)

  fireEvent.click(screen.getByTestId('row-10'))

  expect(screen.getByTestId('row-10')).toHaveTextContent('open')
  expect(screen.queryByTestId('row-20')).not.toBeInTheDocument()
  expect(screen.queryByTestId('pin-game-card')).not.toBeInTheDocument()
})

test('clicking an expanded row again collapses it back to the full grid', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: raPins(10, 20), isLoading: false, reorder })
  render(<MainPagePinnedGames />)

  fireEvent.click(screen.getByTestId('row-10'))
  fireEvent.click(screen.getByTestId('row-10'))

  expect(screen.getByTestId('row-10')).toHaveTextContent('closed')
  expect(screen.getByTestId('row-20')).toBeInTheDocument()
  expect(screen.getByTestId('pin-game-card')).toBeInTheDocument()
})

test('switches back to the recently played view', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: raPins(), isLoading: false, reorder })
  render(<MainPagePinnedGames />)
  fireEvent.click(screen.getByRole('tab', { name: 'View recently played' }))
  expect(setView).toHaveBeenCalledWith('recent')
})

test('reorders the pinned games on drag end', async () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: raPins(10, 20, 30), isLoading: false, reorder })
  render(<MainPagePinnedGames />)

  expect(capturedOnDragEnd).not.toBeNull()
  await capturedOnDragEnd!({ active: { id: 'ra:10' }, over: { id: 'ra:30' } })

  expect(reorder).toHaveBeenCalledWith(raPins(20, 30, 10))
})

test('ignores drag end when dropped on itself or outside a droppable', async () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: raPins(10, 20), isLoading: false, reorder })
  render(<MainPagePinnedGames />)

  await capturedOnDragEnd!({ active: { id: 'ra:10' }, over: { id: 'ra:10' } })
  await capturedOnDragEnd!({ active: { id: 'ra:10' }, over: null })

  expect(reorder).not.toHaveBeenCalled()
})

describe('RA and Steam pins together', () => {
  const MIXED = [
    { source: 'ra' as const, id: 730 },
    { source: 'steam' as const, id: 730 },
  ]

  test('renders each pin with its own platform row, even with the same id', () => {
    ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: MIXED, isLoading: false, reorder })
    render(<MainPagePinnedGames />)
    expect(screen.getByTestId('row-730')).toBeInTheDocument()
    expect(screen.getByTestId('steam-row-730')).toBeInTheDocument()
  })

  test('expanding the Steam pin leaves the RA pin with the same id closed', () => {
    ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: MIXED, isLoading: false, reorder })
    render(<MainPagePinnedGames />)

    fireEvent.click(screen.getByTestId('steam-row-730'))
    expect(screen.getByTestId('steam-row-730')).toHaveTextContent('open')
    expect(screen.queryByTestId('row-730')).not.toBeInTheDocument()
  })

  test('reorders across platforms', async () => {
    ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: MIXED, isLoading: false, reorder })
    render(<MainPagePinnedGames />)
    await capturedOnDragEnd!({ active: { id: 'steam:730' }, over: { id: 'ra:730' } })
    expect(reorder).toHaveBeenCalledWith([MIXED[1], MIXED[0]])
  })

  test('falls back to the grid if the expanded pin is removed', () => {
    ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: MIXED, isLoading: false, reorder })
    const { rerender } = render(<MainPagePinnedGames />)
    fireEvent.click(screen.getByTestId('steam-row-730'))

    ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [MIXED[0]], isLoading: false, reorder })
    rerender(<MainPagePinnedGames />)
    expect(screen.getByTestId('row-730')).toBeInTheDocument()
    expect(screen.getByTestId('pin-game-card')).toBeInTheDocument()
  })
})
