import { fireEvent, render, screen } from '@testing-library/react'
import MainPagePointsStats from './MainPagePointsStats'

jest.mock('@/components/day-achievements-modal/DayAchievementsModal', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <div data-testid="day-modal">{date}</div>,
}))

jest.mock('@/components/period-achievements-modal/PeriodAchievementsModal', () => ({
  __esModule: true,
  default: ({ title, achievements }: { title: string; achievements: unknown[] }) => (
    <div data-testid="period-modal">{title}:{achievements.length}</div>
  ),
}))

const mockT = {
  pointsStats: {
    today: 'Today',
    thisWeek: 'This week',
    thisMonth: 'This month',
    avgPerDay: 'Avg/day (30d)',
    perDay: 'ach/day',
    noActivity: 'no activity',
    active: 'active',
    noStreak: 'no streak',
  },
  userStats: { globalRank: 'Global rank' },
  streak: { title: 'Streak' },
  lineChart: { achievements: 'achievements' },
}
jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ T: mockT }),
}))

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

describe('MainPagePointsStats', () => {
  test('renders loading skeleton with labels only', () => {
    render(<MainPagePointsStats achievements={[]} heatmapAchievements={[]} rank={null} isLoading />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  test('shows no-activity sub label when nothing earned today', () => {
    render(<MainPagePointsStats achievements={[]} heatmapAchievements={[]} rank={null} />)
    expect(screen.getByText('no activity')).toBeInTheDocument()
  })

  test('sums points earned today and this week', () => {
    const achievements = [
      { Date: `${daysAgo(0)} 10:00:00`, Points: 10, HardcoreMode: '1' } as any,
      { Date: `${daysAgo(3)} 10:00:00`, Points: 5, HardcoreMode: '0' } as any,
      { Date: `${daysAgo(20)} 10:00:00`, Points: 100, HardcoreMode: '0' } as any,
    ]
    render(<MainPagePointsStats achievements={achievements} heatmapAchievements={[]} rank={null} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  test('renders global rank pill only when rank is known', () => {
    const { rerender } = render(
      <MainPagePointsStats achievements={[]} heatmapAchievements={[]} rank={null} />,
    )
    expect(screen.queryByText('Global rank')).not.toBeInTheDocument()

    rerender(
      <MainPagePointsStats
        achievements={[]}
        heatmapAchievements={[]}
        rank={{ Rank: 1234, Score: 5000, SoftcoreScore: 0 } as any}
      />,
    )
    expect(screen.getByText('#1234')).toBeInTheDocument()
    expect(screen.getByText('5000 pts')).toBeInTheDocument()
  })

  test('sums only this-calendar-month points from heatmap achievements', () => {
    const heatmapAchievements = [
      { Date: `${daysAgo(2)} 10:00:00`, Points: 50, HardcoreMode: '0' } as any,
      { Date: `${daysAgo(5)} 10:00:00`, Points: 50, HardcoreMode: '0' } as any,
      { Date: '2000-01-01 10:00:00', Points: 999, HardcoreMode: '0' } as any,
    ]
    render(<MainPagePointsStats achievements={[]} heatmapAchievements={heatmapAchievements} rank={null} />)
    expect(screen.getByText('This month')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  test('shows zero for this month when there is no heatmap data', () => {
    render(<MainPagePointsStats achievements={[]} heatmapAchievements={[]} rank={null} />)
    expect(screen.getByText('This month')).toBeInTheDocument()
  })

  test('streak pill links to /racha', () => {
    render(<MainPagePointsStats achievements={[]} heatmapAchievements={[]} rank={null} />)
    expect(screen.getByText('Streak').closest('a')).toHaveAttribute('href', '/racha')
  })

  test('clicking Today opens the day achievements modal for today', () => {
    render(<MainPagePointsStats achievements={[]} heatmapAchievements={[]} rank={null} />)
    expect(screen.queryByTestId('day-modal')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Today').closest('button')!)
    expect(screen.getByTestId('day-modal')).toHaveTextContent(daysAgo(0))
  })

  test('clicking This week opens the period modal with the rolling 7-day achievements', () => {
    const achievements = [
      { Date: `${daysAgo(0)} 10:00:00`, Points: 10, HardcoreMode: '1' } as any,
      { Date: `${daysAgo(3)} 10:00:00`, Points: 5, HardcoreMode: '0' } as any,
      { Date: `${daysAgo(20)} 10:00:00`, Points: 100, HardcoreMode: '0' } as any,
    ]
    render(<MainPagePointsStats achievements={achievements} heatmapAchievements={[]} rank={null} />)
    fireEvent.click(screen.getByText('This week').closest('button')!)
    expect(screen.getByTestId('period-modal')).toHaveTextContent('This week:2')
  })

  test('clicking This month opens the period modal with this-calendar-month achievements', () => {
    const heatmapAchievements = [
      { Date: `${daysAgo(2)} 10:00:00`, Points: 50, HardcoreMode: '0' } as any,
      { Date: '2000-01-01 10:00:00', Points: 999, HardcoreMode: '0' } as any,
    ]
    render(<MainPagePointsStats achievements={[]} heatmapAchievements={heatmapAchievements} rank={null} />)
    fireEvent.click(screen.getByText('This month').closest('button')!)
    expect(screen.getByTestId('period-modal')).toHaveTextContent('This month:1')
  })
})
