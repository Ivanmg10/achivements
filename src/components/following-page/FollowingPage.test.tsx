import { render, screen, fireEvent } from '@testing-library/react'
import FollowingPage from './FollowingPage'
import { useFriendsData } from '@/hooks/useFriendsData'
import { useFollowers } from '@/hooks/useFollowers'
import { useLocationHash } from '@/hooks/useLocationHash'
import { en } from '@/translations/en'

jest.mock('@/hooks/useFriendsData', () => ({ useFriendsData: jest.fn() }))
jest.mock('@/hooks/useFollowers', () => ({ useFollowers: jest.fn() }))
jest.mock('@/hooks/useFollowCounts', () => ({ useFollowCounts: () => ({ counts: { following: 1, followers: 2 }, isLoading: false, error: false }) }))
jest.mock('@/hooks/useLocationHash', () => ({ useLocationHash: jest.fn(() => '') }))
jest.mock('@/hooks/useRankings', () => ({
  useRankings: () => ({
    data: { total: 3, me: { rank: 2, listed: true } },
    rows: [{ username: 'ana', avatar: null, points: 900, isMe: false }, { username: 'me', avatar: null, points: 500, isMe: true }],
  }),
}))

const retry = jest.fn()
beforeEach(() => {
  ;(useFollowers as jest.Mock).mockReturnValue({ followers: null, isLoading: false, error: false, retry })
  ;(useLocationHash as jest.Mock).mockReturnValue('')
})
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
  showcase: [],
  ...over,
})

test('each user you follow is a card that opens their profile', () => {
  setup({ users: [person('a b', { description: 'Retro fan', location: 'ES' })] })
  render(<FollowingPage />)
  expect(screen.getByRole('heading', { name: en.following.title })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'a b' })).toHaveAttribute('href', '/user/a%20b')
  expect(screen.getByText('Retro fan')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: en.following.title }).closest('section')).toHaveTextContent(new RegExp(`1${en.following.people}`, "i"))
})

test('the hero says how many of them are online now', () => {
  setup({ users: [person('ana', { online: true }), person('bob', { online: true }), person('cid')] })
  render(<FollowingPage />)
  expect(screen.getByText(en.following.onlineNow.replace('{n}', '2'))).toBeInTheDocument()
})

test('the rankings card leads to the rankings, saying where you stand', () => {
  setup({})
  render(<FollowingPage />)
  const link = screen.getByRole('link', { name: new RegExp(en.following.rankingsTitle) })
  expect(link).toHaveAttribute('href', '/rankings')
  expect(screen.getByText(en.rankings.teaserRank.replace('{rank}', '2').replace('{total}', '3'))).toBeInTheDocument()
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

test('the lists wait for everyone: no card until the details are in, on both tabs', () => {
  setup({ users: [person('ana')], detailsLoading: true })
  const { unmount } = render(<FollowingPage />)
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
  unmount()

  setup({ users: [person('ana')], detailsLoading: true, error: true })
  render(<FollowingPage />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.following.loadError)
})

test('a second tab lists who follows you, read only when it is open', () => {
  setup({ users: [person('ana')] })
  const { rerender } = render(<FollowingPage />)
  expect(useFollowers).toHaveBeenLastCalledWith(false)
  const tab = screen.getByRole('tab', { name: new RegExp(en.following.followers) })
  expect(tab).toHaveTextContent('2')
  expect(screen.getByRole('tab', { name: new RegExp(en.following.title) })).toHaveAttribute('aria-selected', 'true')

  ;(useLocationHash as jest.Mock).mockReturnValue('#followers')
  ;(useFollowers as jest.Mock).mockReturnValue({ followers: [person('fan')], isLoading: false, error: false, retry })
  rerender(<FollowingPage />)
  expect(useFollowers).toHaveBeenLastCalledWith(true)
  expect(screen.getByRole('tab', { name: new RegExp(en.following.followers) })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('link', { name: 'fan' })).toHaveAttribute('href', '/user/fan')
  expect(screen.queryByRole('link', { name: 'ana' })).not.toBeInTheDocument()

  ;(useFollowers as jest.Mock).mockReturnValue({ followers: [], isLoading: false, error: false, retry })
  rerender(<FollowingPage />)
  expect(screen.getByText(en.following.noFollowersTitle)).toBeInTheDocument()
})
