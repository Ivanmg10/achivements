const mockHeatmap = jest.fn()
jest.mock('@/components/main-page/main-page-charts/MainPageHeatmap', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockHeatmap(props)
    return <div data-testid="heatmap" />
  },
}))

import { render, screen } from '@testing-library/react'
import LibraryDetailCalendar from './LibraryDetailCalendar'
import { en } from '@/translations/en'
import type { InsightAchievement } from '@/utils/gameInsights'

const game = { source: 'psn' as const, id: 3, title: 'Astro Bot' }
const days = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const item = (id: string, at: string | null): InsightAchievement => ({
  id, title: id, description: '', earned: at !== null, earnedAt: at, rarity: 10, points: null, kind: null, iconUrl: null, href: '/x',
})

beforeEach(() => mockHeatmap.mockClear())

test('gives the shared calendar the unlocks of this game, in its shape, under its own title', () => {
  render(<LibraryDetailCalendar items={[item('a', days(30)), item('b', null)]} game={game} />)
  expect(screen.getByTestId('heatmap')).toBeInTheDocument()
  const props = mockHeatmap.mock.calls[0][0]
  expect(props.title).toBe(en.libraryDetail.calendarTitle)
  expect(props.achievements).toHaveLength(1)
  expect(props.achievements[0]).toMatchObject({ GameID: 3, Source: 'psn' })
})

test('ends where the game was left, not today, when it was played long ago', () => {
  render(<LibraryDetailCalendar items={[item('a', days(200))]} game={game} />)
  expect(mockHeatmap.mock.calls[0][0].until).toBeInstanceOf(Date)
})

test('ends today for a game played lately', () => {
  render(<LibraryDetailCalendar items={[item('a', days(1))]} game={game} />)
  expect(mockHeatmap.mock.calls[0][0].until).toBeUndefined()
})

test('says so when nothing was unlocked, instead of an empty grid', () => {
  render(<LibraryDetailCalendar items={[item('a', null)]} game={game} />)
  expect(screen.queryByTestId('heatmap')).not.toBeInTheDocument()
  expect(screen.getByText(en.libraryDetail.noneEarned)).toBeInTheDocument()
})
