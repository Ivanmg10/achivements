import { fireEvent, render, screen } from '@testing-library/react'
import HideGameButton from './HideGameButton'
import { en } from '@/translations/en'
import { useHiddenGames } from '@/context/HiddenGamesContext'

jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))

const hideGame = jest.fn()
beforeEach(() => {
  jest.clearAllMocks()
  ;(useHiddenGames as jest.Mock).mockReturnValue({ hideGame })
})

test('asks first, saying where to bring the game back from', () => {
  render(<HideGameButton source="ra" gameId={5} title="Zelda" image="/i.png" />)
  fireEvent.click(screen.getByRole('button', { name: `${en.cards.hideGame}: Zelda` }))
  expect(screen.getByRole('dialog', { name: en.cards.hideGameTitle })).toHaveTextContent(en.cards.hideGameText.replace('{title}', 'Zelda'))
  expect(hideGame).not.toHaveBeenCalled()
})

test('confirming hides it, with what preferences will need to show it', () => {
  render(<HideGameButton source="steam" gameId={620} title="Portal 2" image="https://cdn/x.jpg" />)
  fireEvent.click(screen.getByRole('button', { name: `${en.cards.hideGame}: Portal 2` }))
  fireEvent.click(screen.getByRole('button', { name: en.cards.hideConfirm }))
  expect(hideGame).toHaveBeenCalledWith({ source: 'steam', id: 620, title: 'Portal 2', image: 'https://cdn/x.jpg' })
})

test('cancelling hides nothing', () => {
  render(<HideGameButton source="ra" gameId={5} title="Zelda" />)
  fireEvent.click(screen.getByRole('button', { name: `${en.cards.hideGame}: Zelda` }))
  fireEvent.click(screen.getByRole('button', { name: en.cards.cancel }))
  expect(hideGame).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('the click does not reach the card around it', () => {
  const onCard = jest.fn()
  render(
    <div onClick={onCard}>
      <HideGameButton source="ra" gameId={5} title="Zelda" />
    </div>,
  )
  fireEvent.click(screen.getByRole('button', { name: `${en.cards.hideGame}: Zelda` }))
  fireEvent.click(screen.getByRole('button', { name: en.cards.cancel }))
  expect(onCard).not.toHaveBeenCalled()
})
