import { render, screen } from '@testing-library/react'
import MainPagePortadaSideLevel from './main-page-portada-side-level/MainPagePortadaSideLevel'
import MainPagePortadaSideStreak from './main-page-portada-side-streak/MainPagePortadaSideStreak'
import MainPagePortadaSideRecent from './main-page-portada-side-recent/MainPagePortadaSideRecent'
import { useVaultMe } from '@/hooks/useVaultMe'
import { useStreakData } from '@/hooks/useStreakData'
import { en } from '@/translations/en'

jest.mock('@/hooks/useVaultMe', () => ({ useVaultMe: jest.fn() }))
jest.mock('@/hooks/useStreakData', () => ({ useStreakData: jest.fn() }))

const NOW = new Date('2026-10-25T10:00:00').getTime()
const unlock = (date: string, title: string, points = 5) => ({
  Date: `${date} 12:00:00`, HardcoreMode: '1', AchievementID: title.length, Title: title, Description: '', BadgeName: '1', Points: points,
  GameID: 7, GameTitle: 'Colosseum', ConsoleName: 'GameCube',
})
const streak = (achievements: ReturnType<typeof unlock>[], days = 46, best = 46) => ({
  achievements, activeStreak: { start: '', end: '', days, achievements: [] }, bestStreak: { start: '', end: '', days: best, achievements: [] },
  now: NOW, isLoading: false, error: null, refetch: jest.fn(),
})

describe('level', () => {
  test('the level in big, the points, what is left, the place and this week; it opens the rankings', () => {
    ;(useVaultMe as jest.Mock).mockReturnValue({ me: { points: 116671, week: 461, rank: 19, rankDelta: 3, days: [10, 0, 20, 30, 0, 40, 50].map((points, i) => ({ start: `2026-10-${19 + i}`, points })) } })
    render(<MainPagePortadaSideLevel />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/rankings')
    expect(screen.getByText('116,671')).toBeInTheDocument()
    expect(screen.getByText('+461')).toBeInTheDocument()
    expect(screen.getByText(en.homeLayout.yourWeek)).toBeInTheDocument()
    expect(screen.getByText('Up 3')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Points per day, last 7 days: 10, 0, 20, 30, 0, 40, 50' })).toBeInTheDocument()
    expect(screen.getByText(/#19/)).toBeInTheDocument()
  })

  test('nothing before anything is scored', () => {
    ;(useVaultMe as jest.Mock).mockReturnValue({ me: { points: 0, week: 0, rank: 0 } })
    const { container } = render(<MainPagePortadaSideLevel />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('streak', () => {
  test('how long, the record, and what today still needs', () => {
    ;(useStreakData as jest.Mock).mockReturnValue(streak([unlock('2026-10-24', 'Yesterday')]))
    render(<MainPagePortadaSideStreak />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/racha')
    expect(screen.getByText('A 46-day streak')).toBeInTheDocument()
    expect(screen.getByText(en.streak.newRecord)).toBeInTheDocument()
    expect(screen.getByText(/Nothing yet today: \d+ h left/)).toBeInTheDocument()
  })

  test('with something today, says how many; no record mark below the best', () => {
    ;(useStreakData as jest.Mock).mockReturnValue(streak([unlock('2026-10-25', 'A'), unlock('2026-10-25', 'B')], 10, 46))
    render(<MainPagePortadaSideStreak />)
    expect(screen.getByText('2 so far today.')).toBeInTheDocument()
    expect(screen.queryByText(en.streak.newRecord)).not.toBeInTheDocument()
  })

  test('nothing without a streak', () => {
    ;(useStreakData as jest.Mock).mockReturnValue({ ...streak([]), activeStreak: null })
    const { container } = render(<MainPagePortadaSideStreak />)
    expect(container).toBeEmptyDOMElement()
  })
})

test('recent: the newest first, four at most, each opening its game', () => {
  ;(useStreakData as jest.Mock).mockReturnValue(
    streak(['2026-10-20', '2026-10-24', '2026-10-21', '2026-10-23', '2026-10-22'].map((d) => unlock(d, `On ${d}`))),
  )
  render(<MainPagePortadaSideRecent />)
  const links = screen.getAllByRole('link')
  expect(links).toHaveLength(4)
  expect(links[0]).toHaveTextContent('On 2026-10-24')
  expect(links[0]).toHaveAttribute('href', '/gameInfo/7')
  expect(screen.queryByText('On 2026-10-20')).not.toBeInTheDocument()
})
