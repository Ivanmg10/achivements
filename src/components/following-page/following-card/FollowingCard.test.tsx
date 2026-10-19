import { render, screen } from '@testing-library/react'
import FollowingCard from './FollowingCard'
import type { FriendOverview } from '@/utils/friends'
import { en } from '@/translations/en'

const friend = (over: Partial<FriendOverview> = {}): FriendOverview => ({
  username: 'luna',
  avatar: null,
  location: 'ES',
  description: 'Hardcore o nada',
  ra: true,
  steam: true,
  psn: false,
  accounts: { ra: 'luna_ra', steam: null },
  favorites: {},
  publicGroups: 2,
  pins: [],
  ...over,
})

const PIN = { source: 'ra' as const, gameId: 3, gameTitle: 'Super Metroid', title: 'Sin daños', description: 'Derrota a Ridley sin daño.', badge: 'https://b/1.png' }

test('who they are, their platforms and their groups; their name opens their profile', () => {
  render(<FollowingCard friend={friend()} />)
  expect(screen.getByRole('link', { name: 'luna' })).toHaveAttribute('href', '/user/luna')
  expect(screen.getByText('Hardcore o nada')).toBeInTheDocument()
  // Each account by the name it goes by there; the platform's name when we have none.
  const accounts = screen.getByRole('list', { name: en.userProfile.platformsLabel })
  expect(accounts).toHaveTextContent('luna_ra')
  expect(accounts).toHaveTextContent('Steam')
  expect(screen.getByRole('img', { name: 'RetroAchievements' })).toBeInTheDocument()
  expect(screen.getByText(en.friends.publicGroups.replace('{n}', '2'))).toBeInTheDocument()
  expect(screen.getByText(en.friends.noPins)).toBeInTheDocument()
  // Not known yet: no last game.
  expect(screen.queryByText(new RegExp(en.following.lastPlayed))).not.toBeInTheDocument()
})

test('the last game played opens it on their page', () => {
  render(<FollowingCard friend={friend()} lastPlayed={{ source: 'steam', id: 620, title: 'Portal 2', at: new Date().toISOString(), image: null, wide: true }} />)
  const link = screen.getByRole('link', { name: /Portal 2/ })
  expect(link).toHaveAttribute('href', '/user/luna/steam/620')
  expect(link).toHaveTextContent(en.following.lastPlayed)
})

test('each pin is a badge opening its game, described by its tooltip', () => {
  render(<FollowingCard friend={friend({ pins: [PIN, { ...PIN, gameId: 4, title: 'Velocista', description: null }] })} />)
  const badge = screen.getByRole('link', { name: 'Sin daños · Super Metroid' })
  expect(badge).toHaveAttribute('href', '/user/luna/ra/3')
  expect(badge).toHaveAccessibleDescription(/Derrota a Ridley sin daño\./)
  expect(screen.getByRole('link', { name: 'Velocista · Super Metroid' })).not.toHaveAttribute('aria-describedby')
})

test('their latest unlocks, small at the foot, up to five, each opening its game', () => {
  const unlock = (i: number) => ({ Date: '2026-10-19 10:00:00', HardcoreMode: '1', AchievementID: i, Title: `Logro ${i}`, Description: `Haz ${i}`, BadgeName: String(i), Points: 5, GameID: 7, GameTitle: 'Zelda', ConsoleName: 'SNES' })
  render(<FollowingCard friend={friend()} recent={[1, 2, 3, 4, 5, 6].map(unlock)} />)
  const row = screen.getByRole('list', { name: en.following.recentUnlocks })
  expect(row.querySelectorAll('li')).toHaveLength(5)
  const first = screen.getByRole('link', { name: 'Logro 1 · Zelda' })
  expect(first).toHaveAttribute('href', '/user/luna/ra/7')
  expect(first).toHaveAccessibleDescription(/Haz 1/)
})
