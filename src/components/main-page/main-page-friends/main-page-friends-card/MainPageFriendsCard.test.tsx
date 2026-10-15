import { render, screen } from '@testing-library/react'
import MainPageFriendsCard from './MainPageFriendsCard'
import type { FriendOverview } from '@/utils/friends'
import { en } from '@/translations/en'

const FRIEND: FriendOverview = {
  username: 'ana',
  avatar: null,
  ra: true,
  steam: true,
  psn: false,
  favorites: { ra: { id: 1, title: 'Zelda', imageIcon: '/i.png' }, steam: { id: 7, title: 'Portal', imageIcon: '' }, psn: null },
  publicGroups: 2,
  pins: [{ source: 'ra', gameId: 1, gameTitle: 'Zelda', title: 'Triforce', badge: 'https://x/b.png' }],
}

test('who they are, their favourites opening their progress, their latest pins and counts', () => {
  render(<MainPageFriendsCard friend={FRIEND} week={7} />)
  expect(screen.getByRole('link', { name: /ana/ })).toHaveAttribute('href', '/user/ana')
  expect(screen.getByRole('link', { name: 'Zelda' })).toHaveAttribute('href', '/user/ana/ra/1')
  expect(screen.getByRole('link', { name: 'Portal' })).toHaveAttribute('href', '/user/ana/steam/7')
  expect(screen.getByText('Triforce')).toBeInTheDocument()
  expect(screen.getByText(en.friends.publicGroups.replace('{n}', '2'))).toBeInTheDocument()
  expect(screen.getByText(en.friends.weekUnlocks.replace('{n}', '7'))).toBeInTheDocument()
})

test('no favourites, no pins and no activity yet: says so, shows nothing made up', () => {
  render(<MainPageFriendsCard friend={{ ...FRIEND, favorites: { ra: null, steam: null, psn: null }, pins: [{ ...FRIEND.pins[0], title: null, badge: null }] }} week={null} />)
  expect(screen.queryByRole('list', { name: en.userProfile.favoriteGames })).not.toBeInTheDocument()
  expect(screen.getByText('—')).toBeInTheDocument()
  expect(screen.queryByText(/this week/)).not.toBeInTheDocument()
  render(<MainPageFriendsCard friend={{ ...FRIEND, pins: [] }} week={null} />)
  expect(screen.getByText(en.friends.noPins)).toBeInTheDocument()
})
