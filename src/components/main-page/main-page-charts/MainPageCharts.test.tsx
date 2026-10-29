jest.mock('@/hooks/useRecentAchievements', () => ({ useRecentAchievements: jest.fn() }))
jest.mock('@/hooks/useActivityHeatmap', () => ({ useActivityHeatmap: jest.fn() }))
jest.mock('@/hooks/useActivityHeatmapYear', () => ({ useActivityHeatmapYear: jest.fn() }))
jest.mock('@/hooks/useGamesInProgressPreview', () => ({ useGamesInProgressPreview: () => ({ listGames: [], isLoading: false }) }))
jest.mock('@/context/GamesDataContext', () => ({ useGamesData: () => ({ all: [], hardcore: [], softcore: [], isLoading: false }) }))
jest.mock('@/hooks/useUserRank', () => ({ useUserRank: () => ({ rank: null, isLoading: false }) }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: () => ({ awards: null, isLoading: false }) }))
jest.mock('@/hooks/useSteamRecentAchievements', () => ({ useSteamRecentAchievements: jest.fn() }))
jest.mock('@/context/MainPlatformContext', () => ({ useMainPlatform: jest.fn() }))
jest.mock('@/hooks/useHomeLayout', () => ({ useHomeLayout: jest.fn() }))
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
jest.mock('../main-page-collection/MainPageCollection', () => mockProbe('collection'))
jest.mock('./MainPageBestPeriod', () => mockProbe('best'))
jest.mock('./main-page-month-compare/MainPageMonthCompare', () => mockProbe('month'))
jest.mock('./main-page-habits/MainPageHabits', () => mockProbe('habits'))
jest.mock('./main-page-journal/MainPageJournal', () => mockProbe('journal'))
jest.mock('./MainPageConsoleNav', () => mockProbe('nav'))
jest.mock('../main-page-groups-section/MainPageGroupsSection', () => mockProbe('groups'))
jest.mock('../main-page-pinned-section/MainPagePinnedSection', () => mockProbe('favorites'))
jest.mock('../main-page-friends/MainPageFriends', () => ({
  __esModule: true,
  default: ({ active }: { active: boolean }) => <div data-testid="friends" data-active={String(active)} />,
}))
jest.mock('./main-page-steam-stats/MainPageSteamStats', () => mockProbe('steam-stats'))
jest.mock('./main-page-steam-nav/MainPageSteamNav', () => mockProbe('steam-nav'))

import { fireEvent, render, screen, within } from '@testing-library/react'
import MainPageCharts from './MainPageCharts'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useActivityHeatmap } from '@/hooks/useActivityHeatmap'
import { useActivityHeatmapYear } from '@/hooks/useActivityHeatmapYear'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { useMainPlatform } from '@/context/MainPlatformContext'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'

const STEAM_UNLOCK = { appId: 620, gameTitle: 'Portal 2', apiname: 'WIN', title: 'Win', badgeUrl: '', unlockedAt: '2024-01-15T10:00:00.000Z' }

function platform(p: 'ra' | 'steam') {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: p, linked: ['ra', 'steam'], setPlatform: jest.fn() })
}

beforeEach(() => {
  ;(useHomeLayout as jest.Mock).mockReturnValue(['classic', jest.fn()])
  ;(useRecentAchievements as jest.Mock).mockReturnValue({ achievements: [{ Title: 'Recent RA', Date: '2024-01-20 10:00:00' }], isLoading: false })
  ;(useActivityHeatmap as jest.Mock).mockReturnValue({ achievements: [{ Title: 'Heatmap RA', Date: '2024-01-10 10:00:00' }], isLoading: false })
  ;(useSteamRecentAchievements as jest.Mock).mockReturnValue({ achievements: [STEAM_UNLOCK], isLoading: false })
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true, library: [], libraryLoading: false })
  // The year context merges both platforms itself, so the page passes it on whole.
  ;(useActivityHeatmapYear as jest.Mock).mockReturnValue({
    achievements: [{ Title: 'Year RA', Date: '2023-06-01 10:00:00' }],
    isLoading: false,
    error: false,
    refetch: jest.fn(),
  })
})

test('feeds the shared activity cards both platforms, newest first', () => {
  platform('ra')
  render(<MainPageCharts />)
  expect(useSteamRecentAchievements).toHaveBeenCalledWith('activity')
  // Steam unlock is dated 2024-01-15, between the two RA fixtures.
  expect(screen.getByTestId('daily')).toHaveTextContent('Recent RA,Win')
  fireEvent.click(screen.getByRole('tab', { name: 'Activity' }))
  expect(screen.getByTestId('top-games')).toHaveTextContent('Recent RA,Win')
})

test('the month, habits and diary read the year every platform already loads', () => {
  platform('ra')
  render(<MainPageCharts />)
  fireEvent.click(screen.getByRole('tab', { name: 'Activity' }))
  for (const id of ['month', 'habits', 'journal']) expect(screen.getByTestId(id)).toHaveTextContent('Year RA')
})

test('loads nothing from Steam without a linked account', () => {
  platform('ra')
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false, library: [], libraryLoading: false })
  render(<MainPageCharts />)
  expect(useSteamRecentAchievements).toHaveBeenCalledWith(null)
})

/** Every card id the section rail can reach, visiting each section in turn. */
function cardsAcrossSections() {
  const seen = new Set<string>()
  for (const tab of screen.getAllByRole('tab')) {
    fireEvent.click(tab)
    document.querySelectorAll('[data-testid]').forEach((el) => seen.add(el.getAttribute('data-testid')!))
  }
  return seen
}

const RA_ONLY = ['points', 'nav']
const STEAM_ONLY = ['steam-stats', 'steam-nav']
const SHARED = ['heatmap', 'daily', 'top-games', 'rarest', 'abandoned', 'collection', 'groups', 'favorites', 'best', 'month', 'habits', 'journal']

test('the shared cards are there whichever platform is selected', () => {
  platform('steam')
  render(<MainPageCharts />)
  const cards = cardsAcrossSections()
  for (const id of SHARED) expect(cards).toContain(id)
})

test('in RA mode, shows the RA versions of the platform-specific cards', () => {
  platform('ra')
  render(<MainPageCharts />)
  const cards = cardsAcrossSections()
  for (const id of RA_ONLY) expect(cards).toContain(id)
  for (const id of STEAM_ONLY) expect(cards).not.toContain(id)
  fireEvent.click(screen.getByRole('tab', { name: 'Activity' }))
  expect(screen.getByTestId('best')).toHaveTextContent('Heatmap RA')
})

test('in Steam mode, swaps them for the Steam versions and feeds best performance Steam unlocks', () => {
  platform('steam')
  render(<MainPageCharts />)
  const cards = cardsAcrossSections()
  for (const id of STEAM_ONLY) expect(cards).toContain(id)
  for (const id of RA_ONLY) expect(cards).not.toContain(id)
  expect(cards).toContain('groups')
  fireEvent.click(screen.getByRole('tab', { name: 'Activity' }))
  expect(screen.getByTestId('best')).toHaveTextContent('Win')
})


test('the heatmap reads the year both platforms share, not the 60-day list', () => {
  platform('ra')
  render(<MainPageCharts />)

  // Its own call would be a second one for data the streak already loaded.
  expect(screen.getByTestId('heatmap')).toHaveTextContent('Year RA')
  expect(screen.getByTestId('heatmap')).not.toHaveTextContent('Heatmap RA')
})

describe('sections', () => {
  test('opens on the overview: stats, heatmap and daily chart', () => {
    platform('ra')
    render(<MainPageCharts />)
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    const open = within(screen.getByRole('tabpanel'))
    expect(open.getByTestId('points')).toBeInTheDocument()
    expect(open.getByTestId('heatmap')).toBeInTheDocument()
    expect(open.queryByTestId('rarest')).not.toBeInTheDocument()
  })

  test('the closed sections stay mounted, but hidden and out of reach', () => {
    platform('ra')
    render(<MainPageCharts />)
    const panels = document.querySelectorAll('[role="tabpanel"]')
    expect(panels).toHaveLength(7)
    for (const p of panels) if (p.getAttribute('aria-hidden') === 'true') expect(p).toHaveClass('hidden')
    const closed = [...panels].filter((p) => p.getAttribute('aria-hidden') === 'true')
    expect(closed).toHaveLength(6)
    for (const p of closed) expect(p).toHaveAttribute('inert')
  })

  test('each panel is labelled by its tab', () => {
    platform('ra')
    render(<MainPageCharts />)
    fireEvent.click(screen.getByRole('tab', { name: 'Collection' }))
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAccessibleName('Collection')
    expect(screen.getByTestId('collection')).toBeInTheDocument()
  })

  test('Following is a section of its own, told when it is open so it loads only then', () => {
    platform('ra')
    render(<MainPageCharts />)
    expect(screen.getByTestId('friends')).toHaveAttribute('data-active', 'false')
    fireEvent.click(screen.getByRole('tab', { name: 'Following' }))
    expect(screen.getByTestId('friends')).toHaveAttribute('data-active', 'true')
  })

  test('opening a section brings it into view, smoothly, top first', () => {
    platform('ra')
    const scroll = jest.fn()
    Element.prototype.scrollIntoView = scroll
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0 })
    render(<MainPageCharts />)
    expect(scroll).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('tab', { name: 'Collection' }))
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(scroll.mock.contexts[0]).toBe(document.querySelector('[data-stats-section]'))
    ;(window.requestAnimationFrame as jest.Mock).mockRestore()
  })
})

test('the pinned achievements have a section of their own', () => {
  platform('ra')
  render(<MainPageCharts />)
  fireEvent.click(screen.getByRole('tab', { name: 'Pinned' }))
  expect(within(screen.getByRole('tabpanel')).getByTestId('favorites')).toBeInTheDocument()
})
