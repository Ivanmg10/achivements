jest.mock('@/components/game-info-header/GameInfoHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="game-header">GameHeader</div>,
}))

jest.mock('@/components/game-info-table/GameInfoTable', () => ({
  __esModule: true,
  default: () => <div data-testid="game-table">GameTable</div>,
}))

jest.mock('@/components/game-info-subset-selector/GameInfoSubsetSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="subset-selector" />,
}))

jest.mock('@/components/loading-page/LoadingPage', () => ({
  __esModule: true,
  default: ({ subtitle }: { subtitle?: string }) => <div data-testid="loading-page">{subtitle}</div>,
}))

global.fetch = jest.fn()

import { render, screen, act } from '@testing-library/react'
import GameInfo from './page'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'

beforeEach(() => {
  ;(useParams as jest.Mock).mockReturnValue({ gameId: '1234' })
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ID: 1, Title: 'Sly Cooper', Achievements: {}, ConsoleID: 21 }),
  })
})

test('renders loading page while gameData is null', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' })
  render(<GameInfo />)
  expect(screen.getByTestId('loading-page')).toBeInTheDocument()
})

test('renders loading page with session before fetch resolves', () => {
  ;(fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { rausername: 'ivan', raid: 'key' } },
    status: 'authenticated',
  })
  render(<GameInfo />)
  expect(screen.getByTestId('loading-page')).toBeInTheDocument()
})

test('renders game info when data loaded', async () => {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { rausername: 'ivan', raid: 'key' } },
    status: 'authenticated',
  })
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ID: 1, Title: 'Sly Cooper', Achievements: {}, ConsoleID: 21 }),
  })
  await act(async () => {
    render(<GameInfo />)
  })
  expect(screen.getByTestId('game-header')).toBeInTheDocument()
  expect(screen.getByTestId('game-table')).toBeInTheDocument()
})

test('renders error message on fetch failure', async () => {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { rausername: 'ivan', raid: 'key' } },
    status: 'authenticated',
  })
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
  await act(async () => {
    render(<GameInfo />)
  })
  expect(screen.getByText(/Error 500/)).toBeInTheDocument()
})
