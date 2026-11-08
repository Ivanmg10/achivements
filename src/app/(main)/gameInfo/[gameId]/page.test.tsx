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

jest.mock('@/components/game-info-skeleton/GameInfoSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-page" />,
}))

global.fetch = jest.fn()

import { render, screen, act } from '@testing-library/react'
import GameInfo from './page'
import { useSession } from 'next-auth/react'
import { useParams, notFound } from 'next/navigation'
import { en } from '@/translations/en'

beforeEach(() => {
  ;(useParams as jest.Mock).mockReturnValue({ gameId: '1234' })
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ID: 1, Title: 'Sly Cooper', Achievements: {}, ConsoleID: 21 }),
  })
})

test('shows the page skeleton while the game loads', () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' })
  render(<GameInfo />)
  expect(screen.getByTestId('loading-page')).toBeInTheDocument()
})

test('shows the page skeleton, not a full-screen loader, until the game is in', () => {
  ;(fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { rausername: 'ivan', raLinked: true } },
    status: 'authenticated',
  })
  render(<GameInfo />)
  expect(screen.getByTestId('loading-page')).toBeInTheDocument()
})

test('renders game info when data loaded', async () => {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { rausername: 'ivan', raLinked: true } },
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
    data: { user: { rausername: 'ivan', raLinked: true } },
    status: 'authenticated',
  })
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 })
  await act(async () => {
    render(<GameInfo />)
  })
  expect(screen.getByRole('alert')).toHaveTextContent(en.gameInfoPage.loadError)
  expect(screen.queryByText(/Error 500/)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: en.gameInfoPage.retry })).toBeInTheDocument()
})

test('a game RA does not know is the not-found screen, not an error to retry (V2-09)', async () => {
  ;(useSession as jest.Mock).mockReturnValue({
    data: { user: { rausername: 'ivan', raLinked: true } },
    status: 'authenticated',
  })
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
  jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await act(async () => {
      render(<GameInfo />)
    })
  } catch {
    // Like Next, the mocked notFound() throws to end the render.
  }
  expect(notFound).toHaveBeenCalled()
})
