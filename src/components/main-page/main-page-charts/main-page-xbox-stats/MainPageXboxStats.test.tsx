jest.mock('@/hooks/useXboxSummary', () => ({ useXboxSummary: jest.fn() }))

import { render, screen } from '@testing-library/react'
import MainPageXboxStats from './MainPageXboxStats'
import { useXboxSummary } from '@/hooks/useXboxSummary'

// The shared row (counts, modals, streak, loading) is in MainPagePeriodStats.contract.test.tsx.
test('shows the gamerscore and the total unlocked, in the reader\'s language', () => {
  ;(useXboxSummary as jest.Mock).mockReturnValue({ summary: { gamerscore: 10242, achievementsUnlocked: 593 } })
  render(<MainPageXboxStats streak={0} achievements={[]} />)
  expect(screen.getByText('10,242')).toBeInTheDocument()
  expect(screen.getByText('593')).toBeInTheDocument()
})
