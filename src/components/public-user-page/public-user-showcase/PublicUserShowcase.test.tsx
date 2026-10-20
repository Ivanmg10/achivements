import { render, screen } from '@testing-library/react'
import PublicUserShowcase from './PublicUserShowcase'
import { useGamesData } from '@/context/GamesDataContext'
import { useUserAwards } from '@/hooks/useUserAwards'

jest.mock('@/context/GamesDataContext', () => ({ useGamesData: jest.fn() }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: () => ({ library: [] }) }))
jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: () => ({ library: [] }) }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: jest.fn() }))
jest.mock('@/components/main-page/main-page-collection/collection-shelf/CollectionShelf', () => ({
  __esModule: true,
  default: ({ games }: { games: { title: string }[] }) => <div data-testid="shelf">{games.map((g) => g.title).join(',')}</div>,
}))
jest.mock('../public-user-achievement-showcase/PublicUserAchievementShowcase', () => ({ __esModule: true, default: () => <div data-testid="showcase" /> }))

const MASTERED = { GameID: 1, Title: 'Zelda', ImageIcon: '', ConsoleID: 3, ConsoleName: 'SNES', MaxPossible: 5, NumAwarded: 5, PctWon: '1', HardcoreMode: '1' }

test('the trophy shelf of their latest games at 100%, and their achievement showcase', () => {
  ;(useGamesData as jest.Mock).mockReturnValue({ all: [MASTERED], isLoading: false })
  ;(useUserAwards as jest.Mock).mockReturnValue({
    awards: { VisibleUserAwards: [{ AwardType: 'Mastery/Completion', AwardData: 1, Title: 'Zelda', AwardedAt: '2026-10-01T00:00:00Z', ConsoleName: 'SNES', ImageIcon: '' }] },
    isLoading: false,
  })
  render(<PublicUserShowcase />)
  expect(screen.getByTestId('shelf')).toHaveTextContent('Zelda')
  expect(screen.getByTestId('showcase')).toBeInTheDocument()
})

test('a placeholder for the shelf while it loads', () => {
  ;(useGamesData as jest.Mock).mockReturnValue({ all: [], isLoading: true })
  ;(useUserAwards as jest.Mock).mockReturnValue({ awards: null, isLoading: false })
  render(<PublicUserShowcase />)
  expect(screen.queryByTestId('shelf')).not.toBeInTheDocument()
})
