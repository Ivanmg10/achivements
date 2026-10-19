import { render, screen, fireEvent } from '@testing-library/react'
import FollowingPage from './FollowingPage'
import { useFriendsData } from '@/hooks/useFriendsData'
import { en } from '@/translations/en'

jest.mock('@/hooks/useFriendsData', () => ({ useFriendsData: jest.fn() }))

const retry = jest.fn()
const setup = ({ users = [], ...over }: Record<string, unknown>) =>
  (useFriendsData as jest.Mock).mockReturnValue({ friends: over.isLoading ? null : users, details: {}, isLoading: false, error: false, retry, ...over })
const person = (username: string, over: Record<string, unknown> = {}) => ({
  username,
  avatar: null,
  ra: true,
  steam: false,
  psn: false,
  favorites: {},
  publicGroups: 0,
  pins: [],
  ...over,
})

test('each user you follow is a card that opens their profile', () => {
  setup({ users: [person('a b', { description: 'Retro fan', location: 'ES' })] })
  render(<FollowingPage />)
  expect(screen.getByRole('heading', { name: en.following.title })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'a b' })).toHaveAttribute('href', '/user/a%20b')
  expect(screen.getByText('Retro fan')).toBeInTheDocument()
  expect(screen.getByText(en.following.people)).toBeInTheDocument()
})

test('the rankings are announced as coming, with no link yet', () => {
  setup({})
  render(<FollowingPage />)
  expect(screen.getByRole('heading', { name: en.following.rankingsTitle })).toBeInTheDocument()
  expect(screen.getByText(en.following.rankingsSoon)).toBeInTheDocument()
})

test('search by name, and platforms that add up', () => {
  setup({ users: [person('ana'), person('bob', { ra: false, steam: true }), person('cid', { steam: true })] })
  render(<FollowingPage />)
  // Only the platforms someone plays on get a chip.
  expect(screen.queryByRole('button', { name: /PlayStation/ })).not.toBeInTheDocument()
  const all = screen.getByRole('button', { name: new RegExp(en.following.allPlatforms) })
  expect(all).toHaveAttribute('aria-pressed', 'true')

  fireEvent.click(screen.getByRole('button', { name: /Steam/ }))
  expect(all).toHaveAttribute('aria-pressed', 'false')
  expect(screen.queryByRole('link', { name: 'ana' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'bob' })).toBeInTheDocument()

  // Steam and RA: only who has both.
  fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))
  expect(screen.getByRole('button', { name: /Steam/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.queryByRole('link', { name: 'bob' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'cid' })).toBeInTheDocument()

  // Clicking one again takes it off; All clears them.
  fireEvent.click(screen.getByRole('button', { name: /Steam/ }))
  expect(screen.getByRole('link', { name: 'ana' })).toBeInTheDocument()
  fireEvent.click(all)
  expect(screen.getByRole('link', { name: 'bob' })).toBeInTheDocument()

  fireEvent.change(screen.getByLabelText(en.following.searchLabel), { target: { value: 'zzz' } })
  expect(screen.getByRole('status')).toHaveTextContent(en.following.noMatches)
})

test('nobody yet says how to follow someone', () => {
  setup({})
  render(<FollowingPage />)
  expect(screen.getByText(en.following.emptyTitle)).toBeInTheDocument()
  expect(screen.getByText(en.following.empty)).toBeInTheDocument()
  expect(screen.queryByLabelText(en.following.searchLabel)).not.toBeInTheDocument()
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
