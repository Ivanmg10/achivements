import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PinToggleButton } from './PinToggleButton'
import { usePinnedGames } from '@/context/PinnedGamesContext'

jest.mock('@/context/PinnedGamesContext', () => ({
  usePinnedGames: jest.fn(),
}))

const pinGame = jest.fn()
const unpinGame = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  pinGame.mockResolvedValue(undefined)
  unpinGame.mockResolvedValue(undefined)
})

test('renders the outline pin icon and "pin" label when not pinned', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ isPinned: () => false, pinGame, unpinGame })
  render(<PinToggleButton gameId={1} />)
  expect(screen.getByTestId('IconPin')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Pin game' })).toHaveAttribute('aria-pressed', 'false')
})

test('renders the filled pin icon and "unpin" label when pinned', () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ isPinned: () => true, pinGame, unpinGame })
  render(<PinToggleButton gameId={1} />)
  expect(screen.getByTestId('IconPinFilled')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Unpin game' })).toHaveAttribute('aria-pressed', 'true')
})

test('pins the game when clicked while unpinned', async () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ isPinned: () => false, pinGame, unpinGame })
  render(<PinToggleButton gameId={42} />)
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(pinGame).toHaveBeenCalledWith(42))
  expect(unpinGame).not.toHaveBeenCalled()
})

test('unpins the game when clicked while pinned', async () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ isPinned: () => true, pinGame, unpinGame })
  render(<PinToggleButton gameId={42} />)
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(unpinGame).toHaveBeenCalledWith(42))
  expect(pinGame).not.toHaveBeenCalled()
})

test('forwards the click event to the onClick prop before toggling', async () => {
  ;(usePinnedGames as jest.Mock).mockReturnValue({ isPinned: () => false, pinGame, unpinGame })
  const onClick = jest.fn()
  render(<PinToggleButton gameId={1} onClick={onClick} />)
  fireEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledTimes(1)
  await waitFor(() => expect(pinGame).toHaveBeenCalled())
})

test('shows an alert when the toggle request fails', async () => {
  pinGame.mockRejectedValue(new Error('fail'))
  ;(usePinnedGames as jest.Mock).mockReturnValue({ isPinned: () => false, pinGame, unpinGame })
  render(<PinToggleButton gameId={1} />)
  fireEvent.click(screen.getByRole('button'))
  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't update pin, please try again")
})
