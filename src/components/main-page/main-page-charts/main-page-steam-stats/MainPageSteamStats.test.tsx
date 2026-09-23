jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn() }))
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

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageSteamStats from './MainPageSteamStats'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function unlock(date: string): RecentAchievement {
  return { Date: date, HardcoreMode: '0', AchievementID: 0, Title: 't', Description: '', BadgeName: '', Points: 0, GameID: 1, GameTitle: 'g', ConsoleName: 'Steam', Source: 'steam' }
}

const GAMES = [{ playtime2Weeks: 90 }, { playtime2Weeks: 90 }] as SteamGameProgress[]

function pill(label: string) {
  return screen.getByText(label).parentElement!
}

beforeEach(() => {
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: { level: 42 } })
})

test('counts unlocks today, this week and this month, with the Steam level and playtime', () => {
  render(<MainPageSteamStats achievements={[unlock(daysAgo(0)), unlock(daysAgo(0)), unlock(daysAgo(3))]} games={GAMES} />)
  expect(pill(en.pointsStats.today)).toHaveTextContent('2')
  expect(pill(en.pointsStats.thisWeek)).toHaveTextContent('3')
  expect(pill(en.steam.level)).toHaveTextContent('42')
  expect(pill(en.steam.last2Weeks)).toHaveTextContent(`3${en.steam.hoursShort}`)
  expect(pill(en.streak.title)).toHaveTextContent('1d')
})

test('opens the day and period modals from the pills', () => {
  render(<MainPageSteamStats achievements={[unlock(daysAgo(0))]} games={[]} />)
  fireEvent.click(pill(en.pointsStats.today))
  expect(screen.getByTestId('day-modal')).toHaveTextContent(new Date().toISOString().split('T')[0])
  fireEvent.click(pill(en.pointsStats.thisWeek))
  expect(screen.getByTestId('period-modal')).toHaveTextContent(`${en.pointsStats.thisWeek}:1`)
})

test('says there is no activity today, and leaves the level out until the profile loads', () => {
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: null })
  render(<MainPageSteamStats achievements={[]} games={[]} />)
  expect(pill(en.pointsStats.today)).toHaveTextContent(en.pointsStats.noActivity)
  expect(screen.queryByText(en.steam.level)).not.toBeInTheDocument()
})

test('shows placeholders while loading', () => {
  render(<MainPageSteamStats achievements={[]} games={[]} isLoading />)
  expect(pill(en.pointsStats.today)).toHaveTextContent('—')
})
