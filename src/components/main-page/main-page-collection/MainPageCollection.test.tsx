import { render, screen } from '@testing-library/react'
import MainPageCollection from './MainPageCollection'
import { usePerfectGamesOrder } from '@/hooks/usePerfectGamesOrder'

jest.mock('@/hooks/usePerfectGamesOrder', () => ({ usePerfectGamesOrder: jest.fn() }))
jest.mock('./collection-shelf/CollectionShelf', () => ({
  __esModule: true,
  default: ({ games }: { games: unknown[] }) => <div data-testid="shelf">{games.length}</div>,
}))
jest.mock('./collection-grid/CollectionGrid', () => ({
  __esModule: true,
  default: ({ games }: { games: { key: string }[] }) => <div data-testid="grid">{games.map((g) => g.key).join(',')}</div>,
}))
jest.mock('./collection-numbers/CollectionNumbers', () => ({ __esModule: true, default: () => <div data-testid="numbers" /> }))

beforeEach(() => {
  ;(usePerfectGamesOrder as jest.Mock).mockReturnValue({ order: ['ra:2', 'ra:1'], saveOrder: jest.fn() })
})

const done = (id: number) => ({ GameID: id, Title: `G${id}`, ImageIcon: '', ConsoleID: 1, ConsoleName: 'SNES', MaxPossible: 1, NumAwarded: 1, PctWon: '1.0', HardcoreMode: '1' })

test('the cabinet on top, then the collection in the saved order beside the numbers', () => {
  render(<MainPageCollection games={[done(1), done(2)]} awards={null} />)
  expect(screen.getByTestId('shelf')).toBeInTheDocument()
  expect(screen.getByTestId('grid')).toHaveTextContent('ra:2,ra:1')
  expect(screen.getByTestId('numbers')).toBeInTheDocument()
})

test('while loading it holds the layout', () => {
  const { container } = render(<MainPageCollection games={[]} awards={null} isLoading />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
})
