import { render, screen } from '@testing-library/react'
import PublicUserKpis from './PublicUserKpis'
import { useStreakData } from '@/hooks/useStreakData'
import { en } from '@/translations/en'
import { streakInk, streakTier } from '@/utils/streakTier'

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

const figure = (label: string) => screen.getByText(label).parentElement!.querySelector('dd')!

test('their pace and streaks, every platform together, as one row of bare figures', () => {
  setup()
  render(<PublicUserKpis />)
  expect(figure(en.userProfile.today)).toHaveTextContent('1')
  expect(figure(en.userProfile.week)).toHaveTextContent('2')
  expect(figure(en.userProfile.month)).toHaveTextContent('3')
  expect(figure(en.userProfile.perDay)).toHaveTextContent('0.1')
  expect(figure(en.userProfile.streak)).toHaveTextContent('8 d')
  expect(figure(en.userProfile.bestStreak)).toHaveTextContent('21 d')
  expect(screen.getByText(en.userProfile.last30Days)).toBeInTheDocument()
  // No boxes: the figures sit side by side with the mark between them.
  expect(screen.getByText(en.userProfile.today).parentElement!.className).not.toContain('bg-bg-main')
  expect(screen.getByText(en.userProfile.week).parentElement!.querySelector('[aria-hidden="true"]')).toHaveClass('before:content-(--mark)')
})

test('a streak is coloured by its tier; a zero is quiet', () => {
  setup()
  const { unmount } = render(<PublicUserKpis />)
  expect(figure(en.userProfile.streak)).toHaveStyle({ color: streakInk(streakTier(8)) })
  unmount()
  setup({ achievements: [], activeStreak: null, bestStreak: null })
  render(<PublicUserKpis />)
  expect(figure(en.userProfile.streak)).toHaveTextContent('0 d')
  expect(figure(en.userProfile.streak).className).toContain('text-text-secondary')
  expect(figure(en.userProfile.today).className).toContain('text-text-secondary')
})

test('says it is loading while the year comes in, holding the six figures\' room', () => {
  setup({ isLoading: true })
  render(<PublicUserKpis />)
  expect(screen.getByText(en.userProfile.loadingActivity)).toBeInTheDocument()
  expect(screen.getByText(en.userProfile.today)).toBeInTheDocument()
  expect(screen.queryByText('0 d')).not.toBeInTheDocument()
})
