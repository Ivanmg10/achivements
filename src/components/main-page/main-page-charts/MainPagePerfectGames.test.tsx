import { fireEvent, render, screen } from '@testing-library/react'
import MainPagePerfectGames from './MainPagePerfectGames'
import { usePerfectGamesOrder } from '@/hooks/usePerfectGamesOrder'

jest.mock('@/hooks/usePerfectGamesOrder', () => ({
  usePerfectGamesOrder: jest.fn(),
}))

jest.mock('@/components/main-page/perfect-games-order-modal/PerfectGamesOrderModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="order-modal" /> : null),
}))

const games = [
  { GameID: 1, Title: 'Sly Cooper', ConsoleName: 'PS2', ImageIcon: '/icon.png', PctWon: '1.0', HardcoreMode: '0' },
  { GameID: 2, Title: 'Jak 2', ConsoleName: 'PS2', ImageIcon: '/icon2.png', PctWon: '1.0', HardcoreMode: '1' },
  { GameID: 3, Title: 'Crash', ConsoleName: 'PS1', ImageIcon: '/icon3.png', PctWon: '0.5', HardcoreMode: '0' },
] as any

beforeEach(() => {
  ;(usePerfectGamesOrder as jest.Mock).mockReturnValue({ order: [], saveOrder: jest.fn() })
})

test('title links to /completed', () => {
  render(<MainPagePerfectGames games={games} />)
  expect(screen.getByRole('link', { name: /Mastered/i })).toHaveAttribute('href', '/completed')
})

test('title links to /completed in the empty state too', () => {
  render(<MainPagePerfectGames games={[]} />)
  expect(screen.getByRole('link', { name: /Mastered/i })).toHaveAttribute('href', '/completed')
})

test('counts hardcore and softcore 100% games separately, excluding non-100% games', () => {
  render(<MainPagePerfectGames games={games} />)
  expect(screen.getByText('1 HC')).toBeInTheDocument()
  expect(screen.getByText('1 SC')).toBeInTheDocument()
})

test('renders only games at 100%', () => {
  render(<MainPagePerfectGames games={games} />)
  const links = screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/gameInfo/'))
  expect(links).toHaveLength(2)
})

test('renders the empty state when there are no 100% games', () => {
  render(<MainPagePerfectGames games={[games[2]]} />)
  expect(screen.queryByText('1 HC')).not.toBeInTheDocument()
})

test('renders skeleton while loading', () => {
  const { container } = render(<MainPagePerfectGames games={[]} isLoading />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
})

test('opens the reorder modal when the edit button is clicked', () => {
  render(<MainPagePerfectGames games={games} />)
  expect(screen.queryByTestId('order-modal')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Reorder mastered games/i }))
  expect(screen.getByTestId('order-modal')).toBeInTheDocument()
})

test('applies the saved custom order to the rendered list', () => {
  ;(usePerfectGamesOrder as jest.Mock).mockReturnValue({ order: [2, 1], saveOrder: jest.fn() })
  render(<MainPagePerfectGames games={games} />)
  const links = screen.getAllByRole('link').filter((l) => l.getAttribute('href')?.startsWith('/gameInfo/'))
  expect(links[0]).toHaveAttribute('href', '/gameInfo/2')
  expect(links[1]).toHaveAttribute('href', '/gameInfo/1')
})
