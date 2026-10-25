import { render, screen } from '@testing-library/react'
import UserFollowStats from './UserFollowStats'
import { useFollowCounts } from '@/hooks/useFollowCounts'
import { en } from '@/translations/en'

jest.mock('@/hooks/useFollowCounts', () => ({ useFollowCounts: jest.fn() }))

const setup = (over: Record<string, unknown>) =>
  (useFollowCounts as jest.Mock).mockReturnValue({ counts: null, isLoading: false, error: false, ...over })

test('both counts in words, each opening its list', () => {
  setup({ counts: { following: 1234, followers: 2 } })
  render(<UserFollowStats />)
  expect(screen.getByRole('link', { name: '1,234 following' })).toHaveAttribute('href', '/following')
  expect(screen.getByRole('link', { name: '2 followers' })).toHaveAttribute('href', '/following#followers')
})

test('a dash while loading; a failure says so', () => {
  setup({ isLoading: true })
  const { unmount } = render(<UserFollowStats />)
  expect(screen.getByText('—')).toBeInTheDocument()
  unmount()
  setup({ error: true })
  render(<UserFollowStats />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.following.countsError)
})
