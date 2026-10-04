import { render, screen, within } from '@testing-library/react'
import { en } from '@/translations/en'
import StreakPage from './StreakPage'
import { useStreakData } from '@/hooks/useStreakData'

jest.mock('@/hooks/useStreakData', () => ({ useStreakData: jest.fn() }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: () => ({ awards: null }) }))
jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

const base = { achievements: [], streaks: [], activeStreak: null, bestStreak: null, now: new Date('2026-06-10T12:00:00').getTime(), isLoading: false, error: false, refetch: jest.fn() }

test('a page title, and a skeleton in the page’s shape while it loads', () => {
  ;(useStreakData as jest.Mock).mockReturnValue({ ...base, isLoading: true })
  render(<StreakPage />)
  expect(screen.getByRole('heading', { level: 1, name: en.streak.title })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
})

test('no streaks yet: says so', () => {
  ;(useStreakData as jest.Mock).mockReturnValue(base)
  render(<StreakPage />)
  expect(screen.getByText(en.streak.noData)).toBeInTheDocument()
})

test('with streaks: the record, the bars and the best streak day by day', () => {
  const best = { start: '2026-05-02', end: '2026-05-04', days: 3, achievements: [] }
  ;(useStreakData as jest.Mock).mockReturnValue({ ...base, streaks: [best], bestStreak: best })
  render(<StreakPage />)
  expect(screen.getAllByText('3 days').length).toBeGreaterThan(0)
  expect(screen.getAllByRole('button', { pressed: true }).length).toBeGreaterThan(0)
  expect(screen.getByRole('heading', { name: en.streak.listTitle })).toBeInTheDocument()
})

test('the year at a glance: quick numbers, the year grid and the weekdays', () => {
  const ach = [{ Date: '2026-06-08 10:00:00' }, { Date: '2026-06-09 10:00:00' }]
  const best = { start: '2026-06-08', end: '2026-06-09', days: 2, achievements: ach }
  ;(useStreakData as jest.Mock).mockReturnValue({ ...base, achievements: ach, streaks: [best], bestStreak: best })
  render(<StreakPage />)
  expect(screen.getByText(en.streak.activeDays)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: en.streak.yearTitle })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: en.streak.weekdaysTitle })).toBeInTheDocument()
  // The two played days in the grid open their streak.
  const year = screen.getByRole('group', { name: en.streak.yearTitle })
  expect(within(year).getAllByRole('button')).toHaveLength(2)
})
