import { render, screen, fireEvent } from '@testing-library/react'
import UserGamePageRa from './UserGamePageRa'
import { useGameProgression } from '@/hooks/useGameProgression'
import { en } from '@/translations/en'

jest.mock('@/hooks/useGameProgression', () => ({ useGameProgression: jest.fn() }))
jest.mock('@/components/game-info-skeleton/GameInfoSkeleton', () => ({ __esModule: true, default: () => <div data-testid="skeleton" /> }))
jest.mock('@/components/game-info-hero-background/GameInfoHeroBackground', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/game-info-header/GameInfoHeader', () => ({
  __esModule: true,
  default: ({ gameData }: { gameData: { Title: string } }) => <h1>{gameData.Title}</h1>,
}))
jest.mock('@/components/game-compare-table/GameCompareTable', () => ({
  __esModule: true,
  default: ({ theirs, comparing, mine }: { theirs: unknown[]; comparing: boolean; mine: unknown[] | null }) => (
    <div data-testid="table" data-count={theirs.length} data-comparing={String(comparing)} data-mine={mine === null ? 'none' : mine.length} />
  ),
}))

const GAME = { ID: 1, Title: 'Zelda', NumDistinctPlayers: 10, Achievements: { 5: { ID: 5, Title: 'A', DisplayOrder: 1, NumAwarded: 1 } } }
const props = { id: '1', username: 'ivan', banner: <nav>banner</nav>, comparing: true, mine: [], mineLoading: false }
const refetch = jest.fn()

test('the game as they have it, with the banner, and the table in compare mode', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game: GAME, error: false, refetch })
  render(<UserGamePageRa {...props} />)
  expect(useGameProgression).toHaveBeenCalledWith('1')
  expect(screen.getByRole('heading', { name: 'Zelda' })).toBeInTheDocument()
  expect(screen.getByText('banner')).toBeInTheDocument()
  const table = screen.getByTestId('table')
  expect(table).toHaveAttribute('data-count', '1')
  expect(table).toHaveAttribute('data-comparing', 'true')
  expect(table).toHaveAttribute('data-mine', '0')
})

test('another game still in the hook is not shown: the skeleton until this one arrives', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game: { ...GAME, ID: 2 }, error: false, refetch })
  render(<UserGamePageRa {...props} />)
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
})

test('a failure says whose progress could not load, with a retry', () => {
  ;(useGameProgression as jest.Mock).mockReturnValue({ game: null, error: true, refetch })
  render(<UserGamePageRa {...props} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.userGame.loadError.replace('{u}', 'ivan'))
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(refetch).toHaveBeenCalled()
})
