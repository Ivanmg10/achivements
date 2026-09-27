import { render, screen } from '@testing-library/react'
import SteamStatusGameList from './SteamStatusGameList'
import { useMasonryLayout } from '@/hooks/useMasonryLayout'

jest.mock('@/hooks/useMasonryLayout', () => ({ useMasonryLayout: jest.fn() }))
jest.mock('@/components/steam/steam-status-game-item/SteamStatusGameItem', () => ({
  __esModule: true,
  default: ({ game, style }: { game: { title: string }; style: React.CSSProperties }) => (
    <div data-testid="card" data-top={String(style.top)} data-visibility={String(style.visibility)}>
      {game.title}
    </div>
  ),
}))

const GAMES = [
  { id: 1, title: 'Portal 2' },
  { id: 2, title: 'Hades' },
] as never[]

function setLayout(positions: { top: number; left: number; width: number }[], height = 300) {
  ;(useMasonryLayout as jest.Mock).mockReturnValue({
    containerRef: { current: null },
    setItemRef: () => () => {},
    positions,
    containerHeight: height,
  })
}

test('lays the cards out with the same masonry hook, columns and gap as the RA list', () => {
  setLayout([])
  render(<SteamStatusGameList games={GAMES} gridCols={3} />)
  expect(useMasonryLayout).toHaveBeenCalledWith(2, 3, 12)
})

test('defaults to two columns', () => {
  setLayout([])
  render(<SteamStatusGameList games={GAMES} />)
  expect(useMasonryLayout).toHaveBeenCalledWith(2, 2, 12)
})

test('positions each card where the layout says, and sizes the container', () => {
  setLayout([{ top: 0, left: 0, width: 400 }, { top: 0, left: 412, width: 400 }], 250)
  const { container } = render(<SteamStatusGameList games={GAMES} />)

  const cards = screen.getAllByTestId('card')
  expect(cards.map((c) => c.textContent)).toEqual(['Portal 2', 'Hades'])
  expect(cards[1].dataset.top).toBe('0')
  expect((container.firstChild as HTMLElement).style.height).toBe('250px')
})

test('keeps cards hidden until the layout has measured them', () => {
  setLayout([])
  render(<SteamStatusGameList games={GAMES} />)
  expect(screen.getAllByTestId('card').every((c) => c.dataset.visibility === 'hidden')).toBe(true)
})
