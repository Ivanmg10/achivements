import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PinGameModal from './PinGameModal'
import { useGamesData } from '@/context/GamesDataContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { toSteamGameProgress } from '@/utils/steamMappers'

jest.mock('@/context/GamesDataContext', () => ({
  useGamesData: jest.fn(),
}))

jest.mock('@/context/PinnedGamesContext', () => ({
  usePinnedGames: jest.fn(),
}))

jest.mock('@/hooks/useRecentlyPlayedGames', () => ({
  useRecentlyPlayedGames: () => ({ games: [], isLoading: false }),
}))

jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

jest.mock('@/context/SteamGamesDataContext', () => ({
  useSteamGamesData: jest.fn(() => ({ library: [] })),
}))

global.fetch = jest.fn()

const sampleGame = {
  GameID: 1,
  Title: 'Sly Cooper',
  ImageIcon: '/icon.png',
  ConsoleID: 21,
  ConsoleName: 'PlayStation 2',
  MaxPossible: 40,
  NumAwarded: 10,
  PctWon: '0.25',
  HardcoreMode: '0',
}

const pinGame = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchWithRetry as jest.Mock).mockResolvedValue({ Results: [] })
  ;(useGamesData as jest.Mock).mockReturnValue({ all: [sampleGame] })
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [], pinGame })
  pinGame.mockResolvedValue(undefined)
})

test('renders nothing when closed', () => {
  const { container } = render(<PinGameModal isOpen={false} onClose={jest.fn()} />)
  expect(container.innerHTML).toBe('')
})

test('renders the search input and hint text when open', () => {
  render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
  expect(screen.getByPlaceholderText('Search a game to pin…')).toBeInTheDocument()
  expect(screen.getAllByText('Search a game to pin…').length).toBeGreaterThan(0)
})

test('calls onClose when the close button is clicked', () => {
  const onClose = jest.fn()
  render(<PinGameModal isOpen={true} onClose={onClose} />)
  fireEvent.click(screen.getByLabelText('Close'))
  expect(onClose).toHaveBeenCalled()
})

test('searching finds a matching game and selecting it shows a chip', () => {
  render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), {
    target: { value: 'sly' },
  })
  fireEvent.click(screen.getByText('Sly Cooper'))
  expect(screen.getByText('Pin (1)')).toBeInTheDocument()
})

test('does not list a game that is already pinned', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [{ source: 'ra', id: 1 }], pinGame })
  render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), {
    target: { value: 'sly' },
  })
  expect(screen.queryByText('Sly Cooper')).not.toBeInTheDocument()
})

test('confirms the selection by pinning each chosen game and closing', async () => {
  const onClose = jest.fn()
  render(<PinGameModal isOpen={true} onClose={onClose} />)
  fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), {
    target: { value: 'sly' },
  })
  fireEvent.click(screen.getByText('Sly Cooper'))
  fireEvent.click(screen.getByText('Pin (1)'))
  await waitFor(() => expect(pinGame).toHaveBeenCalledWith(1, 'ra'))
  expect(onClose).toHaveBeenCalled()
})

test('shows an error and stays open when pinning fails', async () => {
  pinGame.mockRejectedValue(new Error('fail'))
  const onClose = jest.fn()
  render(<PinGameModal isOpen={true} onClose={onClose} />)
  fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), {
    target: { value: 'sly' },
  })
  fireEvent.click(screen.getByText('Sly Cooper'))
  fireEvent.click(screen.getByText('Pin (1)'))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(onClose).not.toHaveBeenCalled()
})

test('adds a game directly by numeric id', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ Title: 'Direct Game', ImageIcon: '/direct.png', ConsoleID: 1, NumAchievements: 10 }),
  })
  render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), {
    target: { value: '99999' },
  })
  const button = screen.getByText(/Open game by ID/).closest('button')!
  fireEvent.click(button)
  expect(await screen.findByText('Direct Game')).toBeInTheDocument()
})

describe('Steam games', () => {
  const PORTAL = toSteamGameProgress({ appid: 1, name: 'Sly Steam Edition', playtime_forever: 60 })

  beforeEach(() => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [PORTAL] })
  })

  afterEach(() => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [] })
  })

  test('are found alongside RA games — even one with the same id', () => {
    render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), { target: { value: 'sly' } })
    expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
    expect(screen.getByText('Sly Steam Edition')).toBeInTheDocument()
  })

  test('are pinned as Steam', async () => {
    render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), { target: { value: 'steam edition' } })
    fireEvent.click(screen.getByText('Sly Steam Edition'))
    fireEvent.click(screen.getByText('Pin (1)'))
    await waitFor(() => expect(pinGame).toHaveBeenCalledWith(1, 'steam'))
  })

  test('an already pinned Steam game is left out, the RA game with its id is not', () => {
    ;(usePinnedGames as jest.Mock).mockReturnValue({ pins: [{ source: 'steam', id: 1 }], pinGame })
    render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), { target: { value: 'sly' } })
    expect(screen.queryByText('Sly Steam Edition')).not.toBeInTheDocument()
    expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
  })
})

test('a failed id lookup leaves the selection empty', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) })
  render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), { target: { value: '99999' } })
  fireEvent.click(screen.getByText(/Open game by ID/).closest('button')!)
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(screen.queryByText(/Pin \(/)).not.toBeInTheDocument()
  ;(console.error as jest.Mock).mockRestore()
})

test('closes on Escape', () => {
  const onClose = jest.fn()
  render(<PinGameModal isOpen={true} onClose={onClose} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})

test('a pasted RA game URL is treated as its id, and a chip can be removed', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ Title: 'From URL' }) })
  render(<PinGameModal isOpen={true} onClose={jest.fn()} />)
  fireEvent.change(screen.getByPlaceholderText('Search a game to pin…'), {
    target: { value: 'https://retroachievements.org/game/4242' },
  })
  expect(screen.getByText(/#4242/)).toBeInTheDocument()
  fireEvent.click(screen.getByText(/Open game by ID/).closest('button')!)
  expect(await screen.findByText('From URL')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Remove From URL' }))
  expect(screen.queryByText('From URL')).not.toBeInTheDocument()
})
