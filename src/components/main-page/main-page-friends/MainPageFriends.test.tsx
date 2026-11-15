import { render, screen, fireEvent } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import MainPageFriends from './MainPageFriends'
import { useFriendsData } from '@/hooks/useFriendsData'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { en } from '@/translations/en'

jest.mock('@/hooks/useFriendsData', () => ({ useFriendsData: jest.fn(), DETAIL_LIMIT: 2 }))
jest.mock('@/hooks/useProfileLibrary', () => ({ useProfileLibrary: jest.fn() }))
jest.mock('./main-page-friends-leaderboard/MainPageFriendsLeaderboard', () => ({
  __esModule: true,
  default: ({ rows }: { rows: { username: string; isMe: boolean }[] }) => (
    <div data-testid="leaderboard" data-rows={rows.map((r) => `${r.username}${r.isMe ? '*' : ''}`).join(',')} />
  ),
}))
jest.mock('./main-page-friends-feed/MainPageFriendsFeed', () => ({
  __esModule: true,
  default: ({ items }: { items: unknown[] }) => <div data-testid="feed" data-count={items.length} />,
}))
jest.mock('./main-page-friends-shared/MainPageFriendsShared', () => ({
  __esModule: true,
  default: ({ rows }: { rows: unknown[] }) => <div data-testid="shared" data-count={rows.length} />,
}))
jest.mock('./main-page-friends-card/MainPageFriendsCard', () => ({
  __esModule: true,
  default: ({ friend, week }: { friend: { username: string }; week: number | null }) => <div data-testid="card" data-week={String(week)}>{friend.username}</div>,
}))

const friend = (username: string) => ({ username, avatar: null, ra: true, steam: false, psn: false, favorites: { ra: null, steam: null, psn: null }, publicGroups: 0, pins: [] })
const game = { key: 'ra:1', source: 'ra', id: 1, title: 'Zelda', subtitle: '', status: 'playing', pct: 50, href: '' }
const retry = jest.fn()

function setup(over: Record<string, unknown> = {}) {
  ;(useFriendsData as jest.Mock).mockReturnValue({ friends: null, details: {}, isLoading: false, detailsLoading: false, error: false, retry, ...over })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'me', avatar: null } }, status: 'authenticated' })
  ;(useProfileLibrary as jest.Mock).mockReturnValue({ games: [game], isLoading: false })
})

test('asks for nothing and shows nothing until the section is first opened, then keeps it', () => {
  setup()
  const { rerender, container } = render(<MainPageFriends active={false} myRecent={[]} />)
  expect(useFriendsData).toHaveBeenLastCalledWith(false)
  expect(container).toBeEmptyDOMElement()
  rerender(<MainPageFriends active myRecent={[]} />)
  expect(useFriendsData).toHaveBeenLastCalledWith(true)
  rerender(<MainPageFriends active={false} myRecent={[]} />)
  expect(useFriendsData).toHaveBeenLastCalledWith(true)
})

test('a placeholder while loading, a retry on failure, and a note when you follow nobody', () => {
  setup({ isLoading: true })
  const { unmount } = render(<MainPageFriends active myRecent={[]} />)
  expect(screen.getByRole('status')).toHaveTextContent(en.friends.loading)
  unmount()

  setup({ error: true })
  const failed = render(<MainPageFriends active myRecent={[]} />)
  fireEvent.click(screen.getByRole('button', { name: en.gameInfoPage.retry }))
  expect(retry).toHaveBeenCalled()
  failed.unmount()

  setup({ friends: [] })
  render(<MainPageFriends active myRecent={[]} />)
  expect(screen.getByText(en.following.emptyTitle)).toBeInTheDocument()
})

test('the whole section waits until everyone is read, then lands at once', () => {
  const details = {
    ana: { recent: [{ Date: new Date().toISOString().slice(0, 19).replace('T', ' '), Title: 'A', GameID: 1 }], games: [{ ...game, pct: 90 }], partial: true },
  }
  setup({ friends: [friend('ana'), friend('bo'), friend('cy')], details, detailsLoading: true })
  const { rerender } = render(<MainPageFriends active myRecent={[]} />)
  expect(screen.getByRole('status')).toHaveTextContent(en.friends.loading)
  expect(screen.queryByTestId('leaderboard')).not.toBeInTheDocument()
  expect(screen.queryByTestId('card')).not.toBeInTheDocument()

  setup({ friends: [friend('ana'), friend('bo'), friend('cy')], details: { ...details, bo: { recent: [], games: [], partial: false } } })
  rerender(<MainPageFriends active myRecent={[]} />)
  expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-rows', 'me*,ana,bo')
  expect(screen.getByTestId('feed')).toHaveAttribute('data-count', '1')
  expect(screen.getByTestId('shared')).toHaveAttribute('data-count', '1')
  expect(screen.getAllByTestId('card').map((c) => c.textContent)).toEqual(['ana', 'bo', 'cy'])
  expect(screen.getAllByTestId('card')[0]).toHaveAttribute('data-week', '1')
  expect(screen.getAllByTestId('card')[2]).toHaveAttribute('data-week', 'null')
  expect(screen.getByText(en.friends.limitNote.replace('{n}', '2'))).toBeInTheDocument()
  expect(screen.getByText(en.friends.partialNote)).toBeInTheDocument()
})

test('the feed fills the height beside the leaderboard, never more; the cards take the whole width below', () => {
  setup({ friends: [friend('ana')], details: { ana: { recent: [], games: [], partial: false } }, detailsLoading: false })
  render(<MainPageFriends active myRecent={[]} />)
  expect(screen.getByTestId('feed')).toHaveAttribute('data-count', '0')
  expect(screen.getByTestId('feed').parentElement).toHaveClass('xl:absolute', 'xl:inset-0')
  expect(screen.getByTestId('feed').parentElement?.parentElement).toHaveClass('relative')
  // The cards are not in the leaderboard's column: their grid goes to three columns on wide screens.
  expect(screen.getByTestId('card').parentElement).toHaveClass('xl:grid-cols-3')
})
