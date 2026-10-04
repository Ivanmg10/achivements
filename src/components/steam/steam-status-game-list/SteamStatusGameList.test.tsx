import { render, screen } from '@testing-library/react'
import SteamStatusGameList from './SteamStatusGameList'

jest.mock('@/components/steam/steam-status-game-item/SteamStatusGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="card">{game.title}</div>,
}))

const GAMES = [
  { id: 1, title: 'Portal 2' },
  { id: 2, title: 'Hades' },
] as never[]

test('the same grid as the RA list, in reading order', () => {
  const { container } = render(<SteamStatusGameList games={GAMES} gridCols={3} />)
  expect(screen.getAllByTestId('card').map((c) => c.textContent)).toEqual(['Portal 2', 'Hades'])
  expect(container.firstChild).toHaveClass('grid', 'lg:grid-cols-3')
})

test('defaults to two columns', () => {
  const { container } = render(<SteamStatusGameList games={GAMES} />)
  expect(container.firstChild).toHaveClass('md:grid-cols-2')
  expect(container.firstChild).not.toHaveClass('lg:grid-cols-3')
})
