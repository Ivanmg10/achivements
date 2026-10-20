import { render, screen, fireEvent } from '@testing-library/react'
import PinGameCard from './PinGameCard'

jest.mock('@/components/pin-game-modal/PinGameModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="pin-game-modal">
        <button onClick={onClose}>close</button>
      </div>
    ) : null,
}))

test('renders the add button and no modal initially', () => {
  render(<PinGameCard />)
  expect(screen.getByRole('button', { name: 'Pin a game' })).toBeInTheDocument()
  expect(screen.queryByTestId('pin-game-modal')).not.toBeInTheDocument()
})

test('opens the pin modal when clicked', async () => {
  render(<PinGameCard />)
  fireEvent.click(screen.getByRole('button', { name: 'Pin a game' }))
  // Downloaded the first time it opens.
  expect(await screen.findByTestId('pin-game-modal')).toBeInTheDocument()
})

test('closes the modal', async () => {
  render(<PinGameCard />)
  fireEvent.click(screen.getByRole('button', { name: 'Pin a game' }))
  fireEvent.click(await screen.findByText('close'))
  expect(screen.queryByTestId('pin-game-modal')).not.toBeInTheDocument()
})
