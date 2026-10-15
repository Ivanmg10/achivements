import { render, screen, fireEvent } from '@testing-library/react'
import UserGamePageSteam from './UserGamePageSteam'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { useSteamGameDetails } from '@/hooks/useSteamGameDetails'
import { en } from '@/translations/en'

jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@/hooks/useSteamAchievements', () => ({ useSteamAchievements: jest.fn() }))
jest.mock('@/hooks/useSteamGameDetails', () => ({ useSteamGameDetails: jest.fn() }))
jest.mock('@/components/game-info-skeleton/GameInfoSkeleton', () => ({ __esModule: true, default: () => <div data-testid="skeleton" /> }))
jest.mock('@/components/steam/steam-game-hero-background/SteamGameHeroBackground', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/steam/steam-game-info-header/SteamGameInfoHeader', () => ({
  __esModule: true,
  default: ({ title, counts }: { title: string; counts: { earned: number; total: number } | null }) => (
    <h1>
      {title} {counts ? `${counts.earned}/${counts.total}` : 'no counts'}
    </h1>
  ),
}))
jest.mock('@/components/game-compare-table/GameCompareTable', () => ({
  __esModule: true,
  default: ({ theirs }: { theirs: unknown[] }) => <div data-testid="table" data-count={theirs.length} />,
}))

const props = { id: '730', username: 'ivan', banner: <nav>banner</nav>, comparing: false, mine: null, mineLoading: false }
const ACH = [{ apiname: 'A', title: 'a', description: '', badgeUrl: '', displayOrder: 1, earned: true, dateEarned: null, globalPct: 1 }]
const retry = jest.fn()

function setup({ library = [] as unknown[], libraryLoading = false, details = null as unknown, achievements = ACH, isLoading = false, error = null as string | null } = {}) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library, libraryLoading })
  ;(useSteamAchievements as jest.Mock).mockReturnValue({ achievements, isLoading, error, retry })
  ;(useSteamGameDetails as jest.Mock).mockReturnValue({ details, isLoading: false })
}

test('their achievements in the game, titled from their library', () => {
  setup({ library: [{ id: 730, title: 'CS2', achievementsLoaded: true, numAwarded: 1, maxPossible: 5 }] })
  render(<UserGamePageSteam {...props} />)
  expect(useSteamAchievements).toHaveBeenCalledWith(730)
  expect(screen.getByRole('heading')).toHaveTextContent('CS2 1/1')
  expect(screen.getByTestId('table')).toHaveAttribute('data-count', '1')
})

test('outside their library, the store name; the library counts before the achievements are in', () => {
  setup({ details: { name: 'Store name' }, achievements: [], isLoading: true })
  const { unmount } = render(<UserGamePageSteam {...props} />)
  expect(screen.getByRole('heading')).toHaveTextContent('Store name no counts')
  expect(screen.getByRole('status')).toBeInTheDocument()
  unmount()
  setup({ library: [{ id: 730, title: 'CS2', achievementsLoaded: true, numAwarded: 2, maxPossible: 5 }], achievements: [] })
  render(<UserGamePageSteam {...props} />)
  expect(screen.getByRole('heading')).toHaveTextContent('CS2 2/5')
})

test('a skeleton until there is anything to title it with; then the app id as a last resort', () => {
  setup({ libraryLoading: true })
  const { unmount } = render(<UserGamePageSteam {...props} />)
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  unmount()
  setup()
  render(<UserGamePageSteam {...props} />)
  expect(screen.getByRole('heading')).toHaveTextContent('App 730')
})

test('a failure says so, with the private-profile hint and a retry', () => {
  setup({ error: 'boom', achievements: [] })
  render(<UserGamePageSteam {...props} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.userGame.loadError.replace('{u}', 'ivan'))
  expect(screen.getByText(en.steam.privateProfileHint)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(retry).toHaveBeenCalled()
})
