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
import MainPagePeriodStats from './MainPagePeriodStats'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

const stamp = (daysAgo: number) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}
const unlock = (daysAgo: number, Source: RecentAchievement['Source'] = 'steam') =>
  ({ Date: stamp(daysAgo), HardcoreMode: '0', AchievementID: 0, Title: 't', Description: '', BadgeName: '', Points: 25, GameID: 1, GameTitle: 'g', ConsoleName: 'c', Source }) as RecentAchievement
const TODAY = stamp(0).slice(0, 10)

const pill = (label: string) => screen.getByText(label).parentElement!
const order = () => [...document.querySelectorAll('.grid > *')].map((p) => p.querySelector('span:not([data-figure-mark])')?.textContent)

test('counts unlocks of every platform together, never RA points', () => {
  render(<MainPagePeriodStats achievements={[unlock(0, 'ra'), unlock(0, 'psn'), unlock(1, 'xbox')]} streak={0} />)
  expect(pill(en.pointsStats.today)).toHaveTextContent('2')
  expect(pill(en.pointsStats.today)).not.toHaveTextContent('50')
  expect(pill(en.pointsStats.thisWeek)).toHaveTextContent('3')
})

test('the third figure is the last 30 days, not the calendar month', () => {
  // 20 days ago is last month early in a month; it is always inside the last 30 days.
  render(<MainPagePeriodStats achievements={[]} monthSource={[unlock(0), unlock(20), unlock(29), unlock(40)]} streak={0} />)
  expect(pill(en.pointsStats.last30Days)).toHaveTextContent('3')
})

test('the unit under a figure follows the plural rules: 1 achievement, 2 achievements', () => {
  render(<MainPagePeriodStats achievements={[unlock(0), unlock(2), unlock(3)]} streak={0} />)
  expect(pill(en.pointsStats.today)).toHaveTextContent(/^Today1achievement$/)
  expect(pill(en.pointsStats.thisWeek)).toHaveTextContent(/^This week3achievements$/)
})

test('says so when nothing was earned today', () => {
  render(<MainPagePeriodStats achievements={[]} streak={0} />)
  expect(pill(en.pointsStats.today)).toHaveTextContent(en.pointsStats.noActivity)
})

test('opens the day, the week and the 30 days from their figures', async () => {
  render(<MainPagePeriodStats achievements={[unlock(0), unlock(2)]} streak={0} />)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.pointsStats.today) }))
  expect(await screen.findByTestId('day-modal')).toHaveTextContent(TODAY)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en.pointsStats.thisWeek) }))
  expect(await screen.findByTestId('period-modal')).toHaveTextContent(`${en.pointsStats.thisWeek}:2`)
})

test('the streak links to its page and is coloured by its tier', () => {
  const { unmount } = render(<MainPagePeriodStats achievements={[]} streak={0} />)
  expect(screen.getByRole('link', { name: new RegExp(en.streak.title) })).toHaveAttribute('href', '/racha')
  expect(screen.getByText('0 d')).not.toHaveAttribute('style')
  unmount()
  render(<MainPagePeriodStats achievements={[]} streak={12} />)
  expect(screen.getByText('12 d')).toHaveAttribute('style', expect.stringContaining('color-mix'))
})

test('no streak given, no streak figure (the cover has its own card)', () => {
  render(<MainPagePeriodStats achievements={[]} streak={null} />)
  expect(screen.queryByText(en.streak.title)).toBeNull()
  expect(order()).toHaveLength(4)
})

test.each([0, null])('while loading, the same figures in the same order as loaded (streak %s)', (streak) => {
  const { unmount } = render(<MainPagePeriodStats achievements={[]} streak={streak} />)
  const loaded = order()
  unmount()
  render(<MainPagePeriodStats achievements={[]} streak={streak} isLoading />)
  expect(order()).toEqual(loaded)
  expect(pill(en.pointsStats.today).querySelector('.bg-skeleton')).toBeInTheDocument()
})

test('the week is today and the 6 days before, the 30 days today and the 29 before, in calendar days (#165, H4)', () => {
  const OLD_TZ = process.env.TZ
  process.env.TZ = 'Pacific/Auckland'
  jest.useFakeTimers({ now: new Date('2026-11-14T08:30:00Z') })
  try {
    const at = (day: string) => ({ ...unlock(0), Date: `${day} 23:59:00` }) as RecentAchievement
    // Sat 14 is today: the week starts on Sun 8 (Sat 7 is out, which a rolling 7 x 24 h would have kept), the 30 days on Oct 16.
    const list = [at('2026-11-14'), at('2026-11-08'), at('2026-11-07'), at('2026-10-16'), at('2026-10-15')]
    render(<MainPagePeriodStats achievements={list} monthSource={list} streak={0} />)
    expect(pill(en.pointsStats.thisWeek)).toHaveTextContent('2')
    expect(pill(en.pointsStats.last30Days)).toHaveTextContent('4')
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en.pointsStats.thisWeek) }))
    expect(screen.getByTestId('period-modal')).toHaveTextContent(`${en.pointsStats.thisWeek}:2`)
  } finally {
    jest.useRealTimers()
    process.env.TZ = OLD_TZ
  }
})
