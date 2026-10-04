import { fireEvent, render, screen } from '@testing-library/react'
import HiddenGamesModal from './HiddenGamesModal'
import { en } from '@/translations/en'
import { useHiddenGames } from '@/context/HiddenGamesContext'

jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))

const showGame = jest.fn()

test('lists the hidden games of both platforms, each with an eye to show it again', () => {
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
  fireEvent.click(screen.getByRole('button', { name: en.userPage.showGame.replace('{title}', 'Portal 2') }))
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
