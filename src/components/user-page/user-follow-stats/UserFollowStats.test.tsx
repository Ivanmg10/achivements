import { render, screen } from '@testing-library/react'
import UserFollowStats from './UserFollowStats'
import { useFollowCounts } from '@/hooks/useFollowCounts'
import { en } from '@/translations/en'

jest.mock('@/hooks/useFollowCounts', () => ({ useFollowCounts: jest.fn() }))

const setup = (over: Record<string, unknown>) =>
  (useFollowCounts as jest.Mock).mockReturnValue({ counts: null, isLoading: false, error: false, ...over })

test('both counts; Following opens the list, followers are only a number', () => {
  setup({ counts: { following: 1234, followers: 2 } })
  render(<UserFollowStats />)
  const link = screen.getByRole('link', { name: new RegExp(en.following.title) })
  expect(link).toHaveAttribute('href', '/following')
  expect(link).toHaveTextContent('1,234')
  expect(screen.getByText(en.following.followers).parentElement).toHaveTextContent('2')
  expect(screen.getAllByRole('link')).toHaveLength(1)
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
