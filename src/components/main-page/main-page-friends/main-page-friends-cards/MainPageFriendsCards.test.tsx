import { render, screen, within } from '@testing-library/react'
import { en } from '@/translations/en'
import type { FriendOverview } from '@/utils/friends'
import MainPageFriendsCards from './MainPageFriendsCards'

jest.mock('../main-page-friends-card/MainPageFriendsCard', () => ({
  __esModule: true,
  default: ({ friend, week }: { friend: { username: string }; week: number | null }) => <a href="#" data-week={String(week)}>{friend.username}</a>,
}))

const people = (n: number) => Array.from({ length: n }, (_, i) => ({ username: `u${i}` }) as FriendOverview)

test('three cards and nothing more when you follow three', () => {
  render(<MainPageFriendsCards friends={people(3)} weeks={{ u0: 4 }} />)
  expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['u0', 'u1', 'u2'])
  expect(screen.getByText('u0')).toHaveAttribute('data-week', '4')
  expect(screen.getByText('u1')).toHaveAttribute('data-week', 'null')
  expect(screen.queryByTestId('friends-peek')).not.toBeInTheDocument()
  expect(screen.getByRole('heading')).toHaveTextContent('3')
})

test('folded: the next cards peek out of reach, and "See more" goes to /following', () => {
  render(<MainPageFriendsCards friends={people(12)} weeks={{}} />)
  const peek = screen.getByTestId('friends-peek')
  expect(peek).toHaveAttribute('aria-hidden', 'true')
  expect(peek).toHaveAttribute('inert')
  expect(within(peek).getAllByText(/^u/).map((c) => c.textContent)).toEqual(['u3', 'u4', 'u5', 'u6'])
  expect(screen.getByRole('link', { name: en.friends.seeMore })).toHaveAttribute('href', '/following')
  // Only the shown cards and the button can be reached: u3 is shown on two columns only.
  expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['u0', 'u1', 'u2', 'u3', en.friends.seeMore])
  expect(screen.getAllByText('u3')[0].parentElement).toHaveClass('hidden', 'sm:grid', 'xl:hidden')
})
