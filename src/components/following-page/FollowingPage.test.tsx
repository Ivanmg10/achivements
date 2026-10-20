import { render, screen, fireEvent } from '@testing-library/react'
import FollowingPage from './FollowingPage'
import { useFollowing } from '@/hooks/useFollowing'
import { en } from '@/translations/en'

jest.mock('@/hooks/useFollowing', () => ({ useFollowing: jest.fn() }))

const retry = jest.fn()
const setup = (over: Record<string, unknown>) =>
  (useFollowing as jest.Mock).mockReturnValue({ users: [], isLoading: false, error: false, retry, ...over })

test('each user you follow opens their profile', () => {
  setup({ users: [{ username: 'a b', avatar: null, description: 'Retro fan', location: 'ES', ra: true, steam: false, psn: false }] })
  render(<FollowingPage />)
  expect(screen.getByRole('heading', { name: en.following.title })).toBeInTheDocument()
  const link = screen.getByRole('link', { name: /a b/ })
  expect(link).toHaveAttribute('href', '/user/a%20b')
  expect(link).toHaveTextContent('Retro fan')
  expect(screen.getByText('1')).toBeInTheDocument()
})

test('nobody yet says how to follow someone', () => {
  setup({})
  render(<FollowingPage />)
  expect(screen.getByText(en.following.emptyTitle)).toBeInTheDocument()
  expect(screen.getByText(en.following.empty)).toBeInTheDocument()
})

test('loading, then a failure with a retry', () => {
  setup({ isLoading: true })
  const { unmount } = render(<FollowingPage />)
  expect(screen.getByRole('status')).toHaveTextContent(en.following.loading)
  unmount()
  setup({ error: true })
  render(<FollowingPage />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.following.loadError)
  fireEvent.click(screen.getByRole('button', { name: en.publicProfile.retry }))
  expect(retry).toHaveBeenCalled()
})
