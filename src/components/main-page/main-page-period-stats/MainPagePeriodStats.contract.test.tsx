jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn() }))
jest.mock('@/hooks/usePsnSummary', () => ({ usePsnSummary: jest.fn() }))
jest.mock('@/hooks/useXboxSummary', () => ({ useXboxSummary: jest.fn() }))
jest.mock('@/components/day-achievements-modal/DayAchievementsModal', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <div data-testid="day-modal">{date}</div>,
}))
jest.mock('@/components/period-achievements-modal/PeriodAchievementsModal', () => ({
  __esModule: true,
  default: ({ title, achievements }: { title: string; achievements: unknown[] }) => (
    <div data-testid="period-modal">{`${title}:${achievements.length}`}</div>
  ),
}))

import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import MainPagePointsStats from '../main-page-charts/MainPagePointsStats'
import MainPageSteamStats from '../main-page-charts/main-page-steam-stats/MainPageSteamStats'
import MainPagePsnStats from '../main-page-charts/main-page-psn-stats/MainPagePsnStats'
import MainPageXboxStats from '../main-page-charts/main-page-xbox-stats/MainPageXboxStats'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

const stamp = (daysAgo: number) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}
const unlock = (daysAgo: number) =>
  ({ Date: stamp(daysAgo), HardcoreMode: '0', AchievementID: 0, Title: 't', Description: '', BadgeName: '', Points: 5, GameID: 1, GameTitle: 'g', ConsoleName: 'c', Source: 'steam' }) as RecentAchievement
const TODAY = stamp(0).slice(0, 10)

type Props = { achievements: RecentAchievement[]; streak?: number; isLoading?: boolean }

type Platform = {
  name: string
  /** What its own pills are called: the first waits for the platform's data and goes if it fails. */
  extras: string[]
  /** Makes its own data wait (`'wait'`), fail (`'fail'`) or arrive. */
  summary: (state: 'wait' | 'fail' | 'ready') => void
  row: (p: Props) => ReactElement
}

const PLATFORMS: Platform[] = [
  {
    name: 'RetroAchievements',
    extras: [],
    summary: () => {},
    row: ({ achievements, streak = 0, isLoading }) => (
      <MainPagePointsStats achievements={achievements} heatmapAchievements={achievements} streak={streak} isLoading={isLoading} rank={null} showRank={false} valueMode="achievements" />
    ),
  },
  {
    name: 'Steam',
    extras: [en.steam.level, en.steam.last2Weeks],
    summary: (s) => (useSteamProfile as jest.Mock).mockReturnValue({ profile: s === 'ready' ? { level: 42 } : null, error: s === 'fail' ? 'failed' : null }),
    row: ({ achievements, streak = 0, isLoading }) => <MainPageSteamStats achievements={achievements} streak={streak} isLoading={isLoading} games={[]} />,
  },
  {
    name: 'PlayStation',
    extras: [en.psn.level, en.psn.platinum],
    summary: (s) => (usePsnSummary as jest.Mock).mockReturnValue({ summary: s === 'ready' ? { trophyLevel: 209, earned: { platinum: 8 } } : null, error: s === 'fail' ? 'failed' : null }),
    row: ({ achievements, streak = 0, isLoading }) => <MainPagePsnStats achievements={achievements} streak={streak} isLoading={isLoading} />,
  },
  {
    name: 'Xbox',
    extras: [en.xbox.gamerscore, en.xbox.achievements],
    summary: (s) => (useXboxSummary as jest.Mock).mockReturnValue({ summary: s === 'ready' ? { gamerscore: 10242, achievementsUnlocked: 593 } : null, error: s === 'fail' ? 'failed' : null }),
    row: ({ achievements, streak = 0, isLoading }) => <MainPageXboxStats achievements={achievements} streak={streak} isLoading={isLoading} />,
  },
]

const pill = (label: string) => screen.getByText(label).parentElement!
const order = () => [...document.querySelectorAll('.flex-wrap > *')].map((p) => p.firstElementChild?.textContent)

describe.each(PLATFORMS)('the home row of figures: $name', (p) => {
  beforeEach(() => p.summary('ready'))

  test('counts what was earned today, this week and this month', () => {
    // Early in a month "3 days ago" may be last month, so only today and a day ago are asserted for the month.
    render(p.row({ achievements: [unlock(0), unlock(0), unlock(1)] }))
    expect(pill(en.pointsStats.today)).toHaveTextContent('2')
    expect(pill(en.pointsStats.thisWeek)).toHaveTextContent('3')
    expect(pill(en.pointsStats.avgPerDay)).toBeInTheDocument()
  })

  test('says so when nothing was earned today', () => {
    render(p.row({ achievements: [] }))
    expect(pill(en.pointsStats.today)).toHaveTextContent(en.pointsStats.noActivity)
  })

  test('opens the day and the week from their figures', async () => {
    render(p.row({ achievements: [unlock(0), unlock(2)] }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en.pointsStats.today) }))
    expect(await screen.findByTestId('day-modal')).toHaveTextContent(TODAY)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en.pointsStats.thisWeek) }))
    expect(await screen.findByTestId('period-modal')).toHaveTextContent(`${en.pointsStats.thisWeek}:2`)
  })

  test('the streak links to its page and is coloured by its tier', () => {
    const { unmount } = render(p.row({ achievements: [], streak: 0 }))
    expect(screen.getByRole('link', { name: new RegExp(en.streak.title) })).toHaveAttribute('href', '/racha')
    expect(screen.getByText('0 d')).not.toHaveAttribute('style')
    unmount()
    render(p.row({ achievements: [], streak: 12 }))
    expect(screen.getByText('12 d')).toHaveAttribute('style', expect.stringContaining('color-mix'))
  })

  test('while loading, the same figures in the same order as loaded', () => {
    const { unmount } = render(p.row({ achievements: [] }))
    const loaded = order()
    unmount()
    render(p.row({ achievements: [], isLoading: true }))
    expect(order()).toEqual(loaded)
    expect(pill(en.pointsStats.today).querySelector('.bg-skeleton')).toBeInTheDocument()
  })
})

describe.each(PLATFORMS.filter((p) => p.extras.length))('its own figures: $name', (p) => {
  test('wait in the row while its data loads, and go if it cannot be read', () => {
    p.summary('wait')
    const { unmount } = render(p.row({ achievements: [] }))
    expect(pill(p.extras[0]).querySelector('.bg-skeleton')).toBeInTheDocument()
    unmount()
    p.summary('fail')
    render(p.row({ achievements: [] }))
    expect(screen.queryByText(p.extras[0])).not.toBeInTheDocument()
  })
})
