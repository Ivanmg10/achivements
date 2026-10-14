import { render, screen } from '@testing-library/react'
import PublicUserKpis from './PublicUserKpis'
import { useStreakData } from '@/hooks/useStreakData'
import { en } from '@/translations/en'

jest.mock('@/hooks/useStreakData', () => ({ useStreakData: jest.fn() }))

const NOW = Date.parse('2026-10-13T12:00:00Z')
const at = (Date: string) => ({ Date })

function setup(over: Record<string, unknown> = {}) {
  ;(useStreakData as jest.Mock).mockReturnValue({
    achievements: [at('2026-10-13 08:00:00'), at('2026-10-12 08:00:00'), at('2026-10-01 08:00:00')],
    activeStreak: { days: 8 },
    bestStreak: { days: 21 },
    now: NOW,
    isLoading: false,
    ...over,
  })
}

const value = (label: string) => screen.getByText(label).parentElement!.querySelector('dd')!.textContent

test('their pace and streaks, every platform together', () => {
  setup()
  render(<PublicUserKpis />)
  expect(value(en.userProfile.today)).toBe('1')
  expect(value(en.userProfile.week)).toBe('2')
  expect(value(en.userProfile.month)).toBe('3')
  expect(value(en.userProfile.perDay)).toBe('0.1')
  expect(value(en.userProfile.streak)).toBe('8 d')
  expect(value(en.userProfile.bestStreak)).toBe('21 d')
  expect(screen.getByText(en.userProfile.last30Days)).toBeInTheDocument()
})

test('no streak is zero days', () => {
  setup({ achievements: [], activeStreak: null, bestStreak: null })
  render(<PublicUserKpis />)
  expect(value(en.userProfile.streak)).toBe('0 d')
})

test('says it is loading while the year comes in', () => {
  setup({ isLoading: true })
  render(<PublicUserKpis />)
  expect(screen.getByText(en.userProfile.loadingActivity)).toBeInTheDocument()
  expect(screen.queryByText(en.userProfile.today)).not.toBeInTheDocument()
})
