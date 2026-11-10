jest.mock('@/hooks/usePsnSummary', () => ({ usePsnSummary: jest.fn() }))

import { render, screen } from '@testing-library/react'
import MainPagePsnStats from './MainPagePsnStats'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { en } from '@/translations/en'

// The shared row (counts, modals, streak, loading) is in MainPagePeriodStats.contract.test.tsx.
test('shows the trophy level and the platinums', () => {
  ;(usePsnSummary as jest.Mock).mockReturnValue({ summary: { trophyLevel: 209, earned: { platinum: 8 } } })
  render(<MainPagePsnStats streak={0} achievements={[]} />)
  expect(screen.getByText(en.psn.level).parentElement).toHaveTextContent('209')
  expect(screen.getByText(en.psn.platinum).parentElement).toHaveTextContent('8')
})
