import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import StreakStatsBanner from './StreakStatsBanner'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))

const streak = (start: string, end: string, days: number) => ({ start, end, days, achievements: [] })

test('a streak going says how far it is from the record', () => {
  render(<StreakStatsBanner activeStreak={streak('2026-10-01', '2026-10-03', 3)} bestStreak={streak('2026-05-02', '2026-06-05', 35)} totalStreaks={53} lastActiveDay="2026-10-03" />)
  expect(screen.getByText('3 days')).toBeInTheDocument()
  expect(screen.getByText('33 days more to beat your record')).toBeInTheDocument()
})

test('matching the record says so', () => {
  const best = streak('2026-09-01', '2026-10-03', 35)
  render(<StreakStatsBanner activeStreak={best} bestStreak={best} totalStreaks={1} lastActiveDay="2026-10-03" />)
  expect(screen.getByText(en.streak.newRecord)).toBeInTheDocument()
})

test('with no streak going, it says when the last achievement was', () => {
  render(<StreakStatsBanner activeStreak={null} bestStreak={streak('2026-05-02', '2026-06-05', 35)} totalStreaks={53} lastActiveDay="2026-09-26" />)
  expect(screen.getByText(en.streak.noStreak)).toBeInTheDocument()
  expect(screen.getByText(/Last achievement: Saturday, September 26/)).toBeInTheDocument()
})
