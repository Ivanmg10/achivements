import { fireEvent, render, screen } from '@testing-library/react'
import HiddenGamesModal from './HiddenGamesModal'
import { en } from '@/translations/en'
import { useHiddenGames } from '@/context/HiddenGamesContext'

jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))
// The picker has its own tests; here only what the dialog hands it.
type PickerProps = { isOpen: boolean; excludeKeys: Set<string>; onConfirm: (p: unknown[]) => Promise<unknown[]> }
const mockPicker = jest.fn((props: PickerProps) => (props.isOpen ? <div data-testid="picker" /> : null))
jest.mock('@/components/game-picker/GamePicker', () => ({ __esModule: true, default: (p: PickerProps) => mockPicker(p) }))

const showGame = jest.fn()
const hideGames = jest.fn()

test('lists the hidden games of both platforms, each with a small Show button', () => {
  ;(useHiddenGames as jest.Mock).mockReturnValue({
    hidden: [
      { source: 'ra', id: 5, title: 'Zelda', image: 'https://retroachievements.org/i.png' },
      { source: 'steam', id: 620, title: 'Portal 2', image: null },
    ],
    showGame,
  })
  render(<HiddenGamesModal isOpen onClose={jest.fn()} />)
  expect(screen.getByRole('dialog', { name: en.userPage.hiddenGames })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  // A word, not an eye icon; the name carries the game it is for.
  const show = screen.getByRole('button', { name: `${en.userPage.showAgain} Portal 2` })
  expect(show).toHaveTextContent(en.userPage.showAgain)
  fireEvent.click(show)
  expect(showGame).toHaveBeenCalledWith(620, 'steam')
})

test('with nothing hidden it says how to hide a game', () => {
  ;(useHiddenGames as jest.Mock).mockReturnValue({ hidden: [], showGame })
  render(<HiddenGamesModal isOpen onClose={jest.fn()} />)
  expect(screen.getByText(en.userPage.hiddenEmpty)).toBeInTheDocument()
})

test('the close button closes it', () => {
  ;(useHiddenGames as jest.Mock).mockReturnValue({ hidden: [], showGame })
  const onClose = jest.fn()
  render(<HiddenGamesModal isOpen onClose={onClose} />)
  fireEvent.click(screen.getByRole('button', { name: en.userPage.close }))
  expect(onClose).toHaveBeenCalled()
})

test('"Hide games" opens the picker, which leaves out what is hidden and hides the picked games', async () => {
  hideGames.mockResolvedValue([{ source: 'ra', id: 7, title: 'Mario', image: null }])
  ;(useHiddenGames as jest.Mock).mockReturnValue({ hidden: [{ source: 'ra', id: 5, title: 'Zelda', image: null }], showGame, hideGames })
  render(<HiddenGamesModal isOpen onClose={jest.fn()} />)
  expect(screen.queryByTestId('picker')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.userPage.hideGamesButton }))
  expect(screen.getByTestId('picker')).toBeInTheDocument()

  const props = mockPicker.mock.calls[mockPicker.mock.calls.length - 1][0]
  expect([...props.excludeKeys]).toEqual(['ra:5'])
  const mario = { key: 'ra:7', source: 'ra', id: 7, title: 'Mario', imageRef: '/Images/7.png' }
  const portal = { key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', imageRef: '' }
  // The ones the server refused come back as picker candidates, to retry.
  expect(await props.onConfirm([mario, portal])).toEqual([mario])
  expect(hideGames).toHaveBeenCalledWith([
    { source: 'ra', id: 7, title: 'Mario', image: expect.stringContaining('/Images/7.png') },
    { source: 'steam', id: 620, title: 'Portal 2', image: null },
  ])
})
