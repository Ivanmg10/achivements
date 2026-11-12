import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import PublicUserKpisSkeleton from './PublicUserKpisSkeleton'

test('the six labels in their row, the numbers on their way', () => {
  const { container } = render(<PublicUserKpisSkeleton />)
  expect(screen.getByText(en.userProfile.loadingActivity)).toBeInTheDocument()
  for (const label of [en.userProfile.today, en.userProfile.week, en.userProfile.month, en.userProfile.perDay, en.userProfile.streak, en.userProfile.bestStreak]) {
    expect(screen.getByText(label)).toBeInTheDocument()
  }
  expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
  expect(container.firstElementChild!.className).toContain('lg:grid-cols-6')
})
