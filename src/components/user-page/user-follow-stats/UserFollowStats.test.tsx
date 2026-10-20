import { render, screen } from '@testing-library/react'
import UserFollowStats from './UserFollowStats'
import { useFollowCounts } from '@/hooks/useFollowCounts'
import { en } from '@/translations/en'

jest.mock('@/hooks/useFollowCounts', () => ({ useFollowCounts: jest.fn() }))

const setup = (over: Record<string, unknown>) =>
  (useFollowCounts as jest.Mock).mockReturnValue({ counts: null, isLoading: false, error: false, ...over })

test('both counts, each opening its list', () => {
  setup({ counts: { following: 1234, followers: 2 } })
  render(<UserFollowStats />)
  const following = screen.getByRole('link', { name: new RegExp(en.following.title) })
  expect(following).toHaveAttribute('href', '/following')
  expect(following).toHaveTextContent('1,234')
  const followers = screen.getByRole('link', { name: new RegExp(en.following.followers) })
  expect(followers).toHaveAttribute('href', '/following#followers')
  expect(followers).toHaveTextContent('2')
})

test('a dash while loading; a failure says so', () => {
  setup({ isLoading: true })
  const { unmount } = render(<UserFollowStats />)
  expect(screen.getAllByText('—')).toHaveLength(2)
  unmount()
  setup({ error: true })
  render(<UserFollowStats />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.following.countsError)
})
