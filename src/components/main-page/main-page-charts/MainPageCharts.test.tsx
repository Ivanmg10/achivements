jest.mock('@/hooks/useRecentAchievements', () => ({ useRecentAchievements: jest.fn() }))
jest.mock('@/hooks/useActivityHeatmap', () => ({ useActivityHeatmap: jest.fn() }))
jest.mock('@/hooks/useGamesInProgressPreview', () => ({ useGamesInProgressPreview: () => ({ listGames: [], isLoading: false }) }))
jest.mock('@/context/GamesDataContext', () => ({ useGamesData: () => ({ all: [], hardcore: [], softcore: [], isLoading: false }) }))
jest.mock('@/hooks/useUserRank', () => ({ useUserRank: () => ({ rank: null, isLoading: false }) }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: () => ({ awards: null, isLoading: false }) }))
jest.mock('@/hooks/useSteamRecentAchievements', () => ({ useSteamRecentAchievements: jest.fn() }))
jest.mock('@/context/MainPlatformContext', () => ({ useMainPlatform: jest.fn() }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))

// The cards themselves have their own tests; here only what each one is fed matters.
function mockProbe(name: string) {
  return {
    __esModule: true,
    default: ({ achievements, isLoading }: { achievements?: { Title: string }[]; isLoading?: boolean }) => (
      <div data-testid={name}>{isLoading ? 'loading' : (achievements ?? []).map((a) => a.Title).join(',')}</div>
    ),
  }
}
jest.mock('./MainPageHeatmap', () => mockProbe('heatmap'))
jest.mock('./MainPageTopGames', () => mockProbe('top-games'))
jest.mock('@/components/achivements-line-chart/AchievementsLineChart', () => mockProbe('daily'))
jest.mock('./MainPagePointsStats', () => mockProbe('points'))
jest.mock('./MainPageRarest', () => mockProbe('rarest'))
jest.mock('./MainPageAbandoned', () => mockProbe('abandoned'))
jest.mock('./MainPageMastery', () => mockProbe('mastery'))
jest.mock('./MainPagePerfectGames', () => mockProbe('perfect'))
jest.mock('./MainPageBestPeriod', () => mockProbe('best'))
jest.mock('./MainPageConsoleNav', () => mockProbe('nav'))
jest.mock('./MainPageGroups', () => mockProbe('groups'))
jest.mock('../main-page-favorites/MainPageFavorites', () => mockProbe('favorites'))
jest.mock('./main-page-steam-stats/MainPageSteamStats', () => mockProbe('steam-stats'))
jest.mock('./main-page-steam-nav/MainPageSteamNav', () => mockProbe('steam-nav'))
jest.mock('./main-page-steam-mastery/MainPageSteamMastery', () => mockProbe('steam-mastery'))

import { render, screen } from '@testing-library/react'
import MainPageCharts from './MainPageCharts'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { useMainPlatform } from '@/context/MainPlatformContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'

const STEAM_UNLOCK = { appId: 620, gameTitle: 'Portal 2', apiname: 'WIN', title: 'Win', badgeUrl: '', unlockedAt: '2024-01-15T10:00:00.000Z' }

function platform(p: 'ra' | 'steam') {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: p })
}

beforeEach(() => {
  ;(useRecentAchievements as jest.Mock).mockReturnValue({ achievements: [{ Title: 'Recent RA', Date: '2024-01-20 10:00:00' }], isLoading: false })
  ;(useActivityHeatmap as jest.Mock).mockReturnValue({ achievements: [{ Title: 'Heatmap RA', Date: '2024-01-10 10:00:00' }], isLoading: false })
  ;(useSteamRecentAchievements as jest.Mock).mockReturnValue({ achievements: [STEAM_UNLOCK], isLoading: false })
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true, library: [], libraryLoading: false })
})

test('feeds the shared activity cards both platforms, newest first', () => {
  platform('ra')
  render(<MainPageCharts />)
  expect(useSteamRecentAchievements).toHaveBeenCalledWith('activity')
  // Steam unlock is dated 2024-01-15, between the two RA fixtures.
  expect(screen.getByTestId('heatmap')).toHaveTextContent('Win,Heatmap RA')
  expect(screen.getByTestId('daily')).toHaveTextContent('Recent RA,Win')
  expect(screen.getByTestId('top-games')).toHaveTextContent('Recent RA,Win')
})

test('loads nothing from Steam without a linked account', () => {
  platform('ra')
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false, library: [], libraryLoading: false })
  render(<MainPageCharts />)
  expect(useSteamRecentAchievements).toHaveBeenCalledWith(null)
})

const RA_ONLY = ['points', 'nav', 'mastery']
const STEAM_ONLY = ['steam-stats', 'steam-nav', 'steam-mastery']
const SHARED = ['heatmap', 'daily', 'top-games', 'rarest', 'abandoned', 'perfect', 'groups', 'favorites', 'best']

test('the shared cards are there whichever platform is selected', () => {
  platform('steam')
  render(<MainPageCharts />)
  for (const id of SHARED) expect(screen.getByTestId(id)).toBeInTheDocument()
})

test('in RA mode, shows the RA versions of the platform-specific cards', () => {
  platform('ra')
  render(<MainPageCharts />)
  for (const id of RA_ONLY) expect(screen.getByTestId(id)).toBeInTheDocument()
  for (const id of STEAM_ONLY) expect(screen.queryByTestId(id)).not.toBeInTheDocument()
  expect(screen.getByTestId('best')).toHaveTextContent('Heatmap RA')
})

test('in Steam mode, swaps them for the Steam versions and feeds best performance Steam unlocks', () => {
  platform('steam')
  render(<MainPageCharts />)
  for (const id of STEAM_ONLY) expect(screen.getByTestId(id)).toBeInTheDocument()
  for (const id of RA_ONLY) expect(screen.queryByTestId(id)).not.toBeInTheDocument()
  expect(screen.getByTestId('best')).toHaveTextContent('Win')
  expect(screen.getByTestId('groups')).toBeInTheDocument()
  expect(screen.getByTestId('favorites')).toBeInTheDocument()
})

