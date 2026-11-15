jest.mock('@/hooks/usePsnTrophies', () => ({ usePsnTrophies: jest.fn() }))
jest.mock('@/hooks/useXboxAchievements', () => ({ useXboxAchievements: jest.fn() }))
jest.mock('@/hooks/useSteamAchievements', () => ({ useSteamAchievements: jest.fn() }))
jest.mock('@/components/game-achievements-progress-chart/GameAchievementsProgressChart', () => ({
  GameAchievementsProgressChart: ({ achievements, isLoading }: { achievements: unknown[]; isLoading: boolean }) => (
    <div data-testid="chart">{isLoading ? 'loading' : achievements.length}</div>
  ),
}))
jest.mock('@/components/psn/psn-trophy-grid/PsnTrophyGrid', () => ({ PsnTrophyGrid: ({ trophies }: { trophies: unknown[] }) => <div data-testid="grid">{trophies.length}</div> }))
jest.mock('@/components/xbox/xbox-achievement-grid/XboxAchievementGrid', () => ({ XboxAchievementGrid: ({ achievements }: { achievements: unknown[] }) => <div data-testid="grid">{achievements.length}</div> }))
jest.mock('@/components/steam/steam-achievement-grid/SteamAchievementGrid', () => ({ SteamAchievementGrid: ({ achievements }: { achievements: unknown[] }) => <div data-testid="grid">{achievements.length}</div> }))
jest.mock('@/components/psn/psn-rarest-trophies/PsnRarestTrophies', () => ({ __esModule: true, default: ({ isLoading }: { isLoading: boolean }) => <div data-testid="side">{isLoading ? 'loading' : 'rarest'}</div> }))
jest.mock('@/components/xbox/xbox-rarest-achievements/XboxRarestAchievements', () => ({ __esModule: true, default: ({ isLoading }: { isLoading: boolean }) => <div data-testid="side">{isLoading ? 'loading' : 'rarest'}</div> }))
jest.mock('@/components/steam/steam-recently-played-expanded/steam-rarest-achievements/SteamRarestAchievements', () => ({ __esModule: true, default: ({ isLoading }: { isLoading: boolean }) => <div data-testid="side">{isLoading ? 'loading' : 'rarest'}</div> }))

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import PsnRecentlyPlayedExpanded from '@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded'
import XboxRecentlyPlayedExpanded from '@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded'
import SteamRecentlyPlayedExpanded from '@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded'

/**
 * What every platform's opened game promises (the shell, `GameExpandedLayout`, and the grid's states,
 * `LazyBadgeGrid`), tested through each adapter. The platform's own extras (PSN's grades and DLC, Xbox's
 * gamerscore and short lists, Steam's stats) are in its adapter's test.
 */

type State = { loaded?: boolean; loading?: boolean; error?: string }
type Platform = {
  name: string
  /** Renders the opened game: 10 achievements known to the list, 4 earned; 2 and 1 once its own list is in. */
  render: (state: State, known?: number) => void
  hook: jest.Mock
  /** What the hook should have been asked for. */
  asked: unknown
  /** The ring once the list is in: earned from the list, over its total (Xbox keeps the game's own, which is longer). */
  loadedRing: string
  texts: { title: string; error: string; retry: string; none: string }
}

const retry = jest.fn()
const answer = (hook: jest.Mock, list: unknown[], s: State) =>
  hook.mockReturnValue({ trophies: list, achievements: list, groups: [], isLoading: !!s.loading, error: s.error ?? null, retry })

const PSN: Platform = {
  name: 'PlayStation',
  hook: usePsnTrophies as jest.Mock,
  asked: 'NPWR00001_00',
  loadedRing: '1 / 2',
  render: (s, known = 10) => {
    answer(usePsnTrophies as jest.Mock, s.loaded ? [{ id: 0, earned: true, groupId: 'default' }, { id: 1, earned: false, groupId: 'default' }] : [], s)
    render(<PsnRecentlyPlayedExpanded game={psnGameFixture({ id: 100, titleId: 'NPWR00001_00', maxPossible: known, numAwarded: known ? 4 : 0 })} />)
  },
  texts: { title: en.psn.trophies, error: en.psn.trophiesError, retry: en.psn.retry, none: en.psn.noTrophies },
}

const XBOX: Platform = {
  name: 'Xbox',
  hook: useXboxAchievements as jest.Mock,
  asked: '1738914043',
  loadedRing: '1 / 10',
  render: (s, known = 10) => {
    answer(useXboxAchievements as jest.Mock, s.loaded ? [{ id: '0', unlocked: true, unlockedAt: '2026-01-01' }, { id: '1', unlocked: false, unlockedAt: null }] : [], s)
    render(<XboxRecentlyPlayedExpanded game={xboxGameFixture({ maxPossible: known, numAwarded: known ? 4 : 0, totalKnown: true })} />)
  },
  texts: { title: en.xbox.achievements, error: en.xbox.achievementsError, retry: en.xbox.retry, none: en.xbox.noAchievements },
}

const STEAM: Platform = {
  name: 'Steam',
  hook: useSteamAchievements as jest.Mock,
  asked: 377160,
  loadedRing: '1 / 2',
  render: (s, known = 10) => {
    const ach = (earned: boolean) => ({ _source: 'steam', id: 'A', apiname: 'A', title: 'A', description: '', earned, dateEarned: null, badgeUrl: '', displayOrder: 0, hidden: false, globalPct: null, likelyOnline: false })
    answer(useSteamAchievements as jest.Mock, s.loaded ? [ach(true), ach(false)] : [], s)
    render(<SteamRecentlyPlayedExpanded game={{ ...toSteamGameProgress({ appid: 377160, name: 'Fallout 4', playtime_forever: 60, has_community_visible_stats: true }), achievementsLoaded: true, maxPossible: known, numAwarded: known ? 4 : 0 }} />)
  },
  texts: { title: en.gameExpanded.allAchievements, error: en.steam.achievementsError, retry: en.steam.retry, none: en.steam.noAchievements },
}

beforeEach(() => jest.clearAllMocks())
afterEach(cleanup)

describe.each([PSN, XBOX, STEAM])('$name opened game', (p) => {
  const ring = (name: string) => expect(screen.getByRole('img', { name })).toBeInTheDocument()

  test('reads its own list when it opens', () => {
    p.render({ loaded: true })
    expect(p.hook).toHaveBeenCalledWith(p.asked)
  })

  test('lays out the ring, the chart, the grid under its heading and the side panel', () => {
    p.render({ loaded: true })
    expect(screen.getByText(p.texts.title, { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByTestId('grid')).toHaveTextContent('2')
    expect(screen.getByTestId('chart')).toHaveTextContent('2')
    expect(screen.getByTestId('side')).toHaveTextContent('rarest')
  })

  test('the ring counts what the list says is earned once it is in', () => {
    p.render({ loaded: true })
    ring(p.loadedRing)
  })

  test('while the list loads, the ring has the counts the feed already had and the room is kept', () => {
    p.render({ loading: true })
    ring('4 / 10')
    expect(screen.getByTestId('chart')).toHaveTextContent('loading')
    expect(screen.getByTestId('side')).toHaveTextContent('loading')
    expect(document.querySelectorAll('[aria-busy="true"] li')).toHaveLength(10)
    expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
  })

  test('a game whose total is not known still has a skeleton of a default size', () => {
    p.render({ loading: true }, 0)
    expect(document.querySelectorAll('[aria-busy="true"] li')).toHaveLength(24)
  })

  test('a failed read says so and can be asked again', () => {
    p.render({ error: 'failed' })
    expect(screen.getByRole('alert')).toHaveTextContent(p.texts.error)
    expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: p.texts.retry }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  test('a game with nothing listed says so, not an empty grid', () => {
    p.render({})
    expect(screen.getByText(p.texts.none)).toBeInTheDocument()
    expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
  })
})
