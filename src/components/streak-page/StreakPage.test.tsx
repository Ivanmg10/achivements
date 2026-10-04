import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import StreakPage from './StreakPage'
import { useStreakData } from '@/hooks/useStreakData'

jest.mock('@/hooks/useStreakData', () => ({ useStreakData: jest.fn() }))
jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: () => ({ awards: null }) }))
jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

const base = { streaks: [], activeStreak: null, bestStreak: null, isLoading: false, error: false, refetch: jest.fn() }

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
