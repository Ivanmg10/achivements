jest.mock('@/hooks/usePsnSummary', () => ({ usePsnSummary: jest.fn() }))

import { render, screen } from '@testing-library/react'
import MainPagePsnStats from './MainPagePsnStats'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

const today = new Date().toISOString().split('T')[0]
const unlock = (date: string) => ({ Date: `${date} 12:00:00`, Source: 'psn' }) as RecentAchievement

beforeEach(() => {
  ;(usePsnSummary as jest.Mock).mockReturnValue({ summary: { trophyLevel: 209, earned: { platinum: 8 } } })
})

test("today's trophies, the level and the platinums", () => {
  render(<MainPagePsnStats streak={0} achievements={[unlock(today), unlock(today)]} />)
  expect(screen.getByText(en.pointsStats.today).parentElement).toHaveTextContent('2')
  expect(screen.getByText('209')).toBeInTheDocument()
  expect(screen.getByText('8')).toBeInTheDocument()
})

test('placeholders while loading', () => {
  const { container } = render(<MainPagePsnStats streak={0} achievements={[]} isLoading />)
  expect(container.querySelectorAll('.bg-skeleton').length).toBeGreaterThan(3)
})

test('without a summary yet, its pills wait in the row, and go if it fails', () => {
  ;(usePsnSummary as jest.Mock).mockReturnValue({ summary: null, error: null })
  const { unmount } = render(<MainPagePsnStats streak={0} achievements={[]} />)
  expect(screen.getByText(en.psn.level).parentElement?.querySelector('.bg-skeleton')).toBeInTheDocument()
  unmount()
  ;(usePsnSummary as jest.Mock).mockReturnValue({ summary: null, error: 'failed' })
  render(<MainPagePsnStats streak={0} achievements={[]} />)
  expect(screen.queryByText(en.psn.level)).not.toBeInTheDocument()
})
