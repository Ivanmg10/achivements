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
] as never

function steamGame(id: number, over: Record<string, unknown> = {}) {
  return {
    _source: 'steam', id, title: 'Steam ' + id, imageIcon: 'https://cdn/' + id + '.jpg', consoleName: 'Steam',
    maxPossible: 10, numAwarded: 10, pctWon: 100, lastPlayed: '2024-01-01T00:00:00.000Z',
    playtimeForever: 100, playtime2Weeks: 0, imgLogoUrl: '', hasStats: true, achievementsLoaded: true, ...over,
  } as never
}

/** Game tiles, in the order they are rendered. */
function tiles() {
  return screen
    .getAllByRole('link')
    .map((l) => l.getAttribute('href'))
    .filter((href) => href?.startsWith('/gameInfo/') || href?.startsWith('/steamGame/'))
}

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
  expect(tiles()).toHaveLength(2)
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
  ;(usePerfectGamesOrder as jest.Mock).mockReturnValue({ order: ['ra:2', 'ra:1'], saveOrder: jest.fn() })
  render(<MainPagePerfectGames games={games} />)
  expect(tiles()).toEqual(['/gameInfo/2', '/gameInfo/1'])
})

describe('with Steam games', () => {
  test('counts Steam perfect games apart from RA’s', () => {
    render(<MainPagePerfectGames games={games} steamGames={[steamGame(620), steamGame(621, { numAwarded: 3, pctWon: 30 })]} />)
    expect(screen.getByText('1 Steam')).toBeInTheDocument()
    expect(screen.getByText('1 HC')).toBeInTheDocument()
  })

  test('orders both platforms as one list, the saved order first', () => {
    ;(usePerfectGamesOrder as jest.Mock).mockReturnValue({ order: ['steam:620', 'ra:1'], saveOrder: jest.fn() })
    render(<MainPagePerfectGames games={games} steamGames={[steamGame(620)]} />)
    // Saved first, then whatever it does not name, by title.
    expect(tiles()).toEqual(['/steamGame/620', '/gameInfo/1', '/gameInfo/2'])
  })

  test('draws Steam tiles from the official game icon, at its native size', () => {
    const { container } = render(<MainPagePerfectGames games={[]} steamGames={[steamGame(620)]} />)
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toBe('https://cdn/620.jpg')
    expect(img.getAttribute('width')).toBe('32')
  })

  test('keeps the reorder button for a Steam-only list, since it is ordered too', () => {
    render(<MainPagePerfectGames games={[]} steamGames={[steamGame(620)]} />)
    expect(screen.getByRole('button', { name: /Reorder mastered games/i })).toBeInTheDocument()
    expect(tiles()).toEqual(['/steamGame/620'])
  })
})
