import { render, screen, fireEvent } from '@testing-library/react'
import UserGamePagePsn from './UserGamePagePsn'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { en } from '@/translations/en'

jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/hooks/usePsnTrophies', () => ({ usePsnTrophies: jest.fn() }))
jest.mock('@/hooks/usePsnGameDetails', () => ({ usePsnGameDetails: () => ({ details: null }) }))
jest.mock('@/components/game-info-skeleton/GameInfoSkeleton', () => ({ __esModule: true, default: () => <div data-testid="skeleton" /> }))
jest.mock('@/components/psn/psn-game-hero-background/PsnGameHeroBackground', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/psn/psn-game-info-header/PsnGameInfoHeader', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <h1>{game.title}</h1>,
}))
jest.mock('@/components/game-compare-table/GameCompareTable', () => ({
  __esModule: true,
  default: ({ theirs }: { theirs: unknown[] }) => <div data-testid="table" data-count={theirs.length} />,
}))

const TITLE_ID = 'NPWR20188_00'
const props = { id: TITLE_ID, username: 'ivan', banner: <nav>banner</nav>, comparing: false, mine: null, mineLoading: false }
const GAME = psnGameFixture({ titleId: TITLE_ID, title: 'Bloodborne' })
const TROPHY = { id: 1, name: 'T', detail: '', iconUrl: null, type: 'bronze', groupId: 'default', hidden: false, earned: true, earnedAt: null, rarity: 50 }
const retry = jest.fn()

function setup({ library = [GAME] as unknown[], libraryLoading = false, trophies = [TROPHY] as unknown[], isLoading = false, error = null as string | null } = {}) {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ library, libraryLoading })
  ;(usePsnTrophies as jest.Mock).mockReturnValue({ trophies, isLoading, error, retry })
}

test('their trophies in the game', () => {
  setup()
  render(<UserGamePagePsn {...props} />)
  expect(usePsnTrophies).toHaveBeenCalledWith(TITLE_ID)
  expect(screen.getByRole('heading', { name: 'Bloodborne' })).toBeInTheDocument()
  expect(screen.getByTestId('table')).toHaveAttribute('data-count', '1')
})

test('a game outside their trophy list says they have not played it', () => {
  setup({ library: [] })
  render(<UserGamePagePsn {...props} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.userGame.notInTheirList.replace('{u}', 'ivan'))
})

test('loading: the skeleton for the list, a placeholder for the trophies', () => {
  setup({ library: [], libraryLoading: true })
  const { unmount } = render(<UserGamePagePsn {...props} />)
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  unmount()
  setup({ isLoading: true })
  render(<UserGamePagePsn {...props} />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})

test('a private profile is told as such, with a retry', () => {
  setup({ error: 'private', trophies: [] })
  render(<UserGamePagePsn {...props} />)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(retry).toHaveBeenCalled()
})
