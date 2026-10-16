jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/hooks/useXboxAchievements', () => ({ useXboxAchievements: jest.fn() }))
jest.mock('@/hooks/useXboxGameDetails', () => ({ useXboxGameDetails: () => ({ details: null }) }))
jest.mock('@/components/game-info-skeleton/GameInfoSkeleton', () => ({ __esModule: true, default: () => <div data-testid="skeleton" /> }))
jest.mock('@/components/xbox/xbox-game-hero-background/XboxGameHeroBackground', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/xbox/xbox-game-info-header/XboxGameInfoHeader', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <h1>{game.title}</h1>,
}))
jest.mock('@/components/game-compare-table/GameCompareTable', () => ({
  __esModule: true,
  default: ({ theirs }: { theirs: unknown[] }) => <div data-testid="table" data-count={theirs.length} />,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import UserGamePageXbox from './UserGamePageXbox'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { xboxAchievementFixture, xboxGameFixture } from '@/test-utils/xboxFixtures'
import { en } from '@/translations/en'

const TITLE_ID = '1738914043'
const props = { id: TITLE_ID, username: 'ivan', banner: <nav>banner</nav>, comparing: false, mine: null, mineLoading: false }
const GAME = xboxGameFixture({ titleId: TITLE_ID, title: 'Halo' })
const retry = jest.fn()

function setup({ library = [GAME] as unknown[], libraryLoading = false, achievements = [xboxAchievementFixture()] as unknown[], isLoading = false, error = null as string | null } = {}) {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ library, libraryLoading })
  ;(useXboxAchievements as jest.Mock).mockReturnValue({ achievements, isLoading, error, retry })
}

test('their achievements in the game', () => {
  setup()
  render(<UserGamePageXbox {...props} />)
  expect(useXboxAchievements).toHaveBeenCalledWith(TITLE_ID)
  expect(screen.getByRole('heading', { name: 'Halo' })).toBeInTheDocument()
  expect(screen.getByTestId('table')).toHaveAttribute('data-count', '1')
})

test('a game outside their library says they have not played it', () => {
  setup({ library: [] })
  render(<UserGamePageXbox {...props} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.userGame.notInTheirList.replace('{u}', 'ivan'))
})

test('loading: the skeleton for the library, a placeholder for the achievements', () => {
  setup({ library: [], libraryLoading: true })
  const { unmount } = render(<UserGamePageXbox {...props} />)
  expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  unmount()
  setup({ isLoading: true })
  render(<UserGamePageXbox {...props} />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})

test('a private profile is told as such, with a retry', () => {
  setup({ error: 'private', achievements: [] })
  render(<UserGamePageXbox {...props} />)
  expect(screen.getByText(en.xbox.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(retry).toHaveBeenCalled()
})
