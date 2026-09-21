import { render, screen, fireEvent } from '@testing-library/react'
import SteamRecentlyPlayedExpanded from './SteamRecentlyPlayedExpanded'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamAchievementUnified, SteamGameProgress } from '@/types/steam'

jest.mock('@/hooks/useSteamAchievements', () => ({ useSteamAchievements: jest.fn() }))
jest.mock('@/components/ui/CircularProgress', () => ({
  CircularProgress: ({ earned, total }: { earned: number; total: number }) => (
    <div data-testid="ring">{earned}/{total}</div>
  ),
}))
jest.mock('@/components/game-achievements-progress-chart/GameAchievementsProgressChart', () => ({
  GameAchievementsProgressChart: ({ achievements, isLoading }: { achievements: { DateEarned: string | null }[]; isLoading: boolean }) => (
    <div data-testid="chart">{isLoading ? 'loading' : achievements.map((a) => a.DateEarned ?? '-').join(',')}</div>
  ),
}))
jest.mock('@/components/steam/steam-achievement-grid/SteamAchievementGrid', () => ({
  SteamAchievementGrid: ({ achievements, badgeSize }: { achievements: unknown[]; badgeSize: number }) => (
    <div data-testid="grid">{achievements.length}:{badgeSize}</div>
  ),
}))
jest.mock('./steam-expanded-stats/SteamExpandedStats', () => ({
  __esModule: true,
  default: (props: { completionPct: number; remaining: number; playtimeForever: number }) => (
    <div data-testid="stats">{props.completionPct}%|{props.remaining}|{props.playtimeForever}</div>
  ),
}))
jest.mock('./steam-rarest-achievements/SteamRarestAchievements', () => ({
  __esModule: true,
  default: ({ achievements, isLoading }: { achievements: unknown[]; isLoading: boolean }) => (
    <div data-testid="rarest">{isLoading ? 'loading' : achievements.length}</div>
  ),
}))

const retry = jest.fn()

const GAME: SteamGameProgress = {
  ...toSteamGameProgress({ appid: 377160, name: 'Fallout 4', playtime_forever: 29055, has_community_visible_stats: true }),
  achievementsLoaded: true,
  maxPossible: 84,
  numAwarded: 21,
}

function ach(earned: boolean, date: string | null = null): SteamAchievementUnified {
  return {
    _source: 'steam', id: 'A', apiname: 'A', title: 'A', description: '', earned, dateEarned: date,
    badgeUrl: '', displayOrder: 0, hidden: false, globalPct: null,
  }
}

function setHook(overrides: Record<string, unknown> = {}) {
  ;(useSteamAchievements as jest.Mock).mockReturnValue({ achievements: [], isLoading: false, error: null, retry, ...overrides })
}

beforeEach(() => {
  jest.clearAllMocks()
  setHook()
})

test('loads this game\'s achievements when opened', () => {
  render(<SteamRecentlyPlayedExpanded game={GAME} />)
  expect(useSteamAchievements).toHaveBeenCalledWith(377160)
})

test('has the same four panels as the RA dashboard', () => {
  setHook({ achievements: [ach(true, '2024-01-15T12:00:00.000Z'), ach(false)] })
  render(<SteamRecentlyPlayedExpanded game={GAME} />)

  expect(screen.getByTestId('ring')).toBeInTheDocument()
  expect(screen.getByTestId('chart')).toBeInTheDocument()
  expect(screen.getByTestId('grid')).toHaveTextContent('2:40')
  expect(screen.getByTestId('rarest')).toHaveTextContent('2')
  expect(screen.getByText(en.gameExpanded.allAchievements)).toBeInTheDocument()
})

test('counts from the loaded achievements once they are in', () => {
  setHook({ achievements: [ach(true), ach(true), ach(false), ach(false)] })
  render(<SteamRecentlyPlayedExpanded game={GAME} />)
  expect(screen.getByTestId('ring')).toHaveTextContent('2/4')
  expect(screen.getByTestId('stats')).toHaveTextContent('50%|2|29055')
})

test('uses the feed counts for the ring while achievements load', () => {
  setHook({ isLoading: true })
  const { container } = render(<SteamRecentlyPlayedExpanded game={GAME} />)

  expect(screen.getByTestId('ring')).toHaveTextContent('21/84')
  expect(screen.getByTestId('stats')).toHaveTextContent('25%|63')
  expect(screen.getByTestId('chart')).toHaveTextContent('loading')
  expect(screen.getByTestId('rarest')).toHaveTextContent('loading')
  // A badge skeleton sized to the known count.
  expect(container.querySelector('[aria-busy="true"]')!.children).toHaveLength(60)
})

test('feeds the chart the unlock dates', () => {
  setHook({ achievements: [ach(true, '2024-01-15T12:00:00.000Z'), ach(false)] })
  render(<SteamRecentlyPlayedExpanded game={GAME} />)
  expect(screen.getByTestId('chart')).toHaveTextContent('2024-01-15T12:00:00.000Z,-')
})

test('announces a load failure with a retry', () => {
  setHook({ error: 'boom' })
  render(<SteamRecentlyPlayedExpanded game={GAME} />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.achievementsError)
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(retry).toHaveBeenCalledTimes(1)
})

test('says so when there turn out to be no achievements', () => {
  render(<SteamRecentlyPlayedExpanded game={{ ...GAME, achievementsLoaded: false, maxPossible: 0, numAwarded: 0 }} />)
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
  expect(screen.getByTestId('ring')).toHaveTextContent('0/0')
  expect(screen.getByTestId('stats')).toHaveTextContent('0%|0')
})

test('uses a default skeleton size when the count is unknown', () => {
  setHook({ isLoading: true })
  const { container } = render(<SteamRecentlyPlayedExpanded game={{ ...GAME, maxPossible: 0, numAwarded: 0 }} />)
  expect(container.querySelector('[aria-busy="true"]')!.children).toHaveLength(24)
})
