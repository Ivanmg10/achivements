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
  showcase: [],
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
  // Nothing in the showcase, and unlocks not read yet: neither says a wrong "none".
  expect(screen.queryByRole('list', { name: en.friends.showcase })).not.toBeInTheDocument()
  expect(screen.queryByText(en.following.recentUnlocks)).not.toBeInTheDocument()
  // Not known yet: no last game.
  expect(screen.queryByText(new RegExp(en.following.lastPlayed))).not.toBeInTheDocument()
})

test('the last game played opens it on their page', () => {
  render(<FollowingCard friend={friend()} lastPlayed={{ source: 'steam', id: 620, title: 'Portal 2', at: new Date().toISOString(), image: null, wide: true }} />)
  const link = screen.getByRole('link', { name: /Portal 2/ })
  expect(link).toHaveAttribute('href', '/user/luna/steam/620')
  expect(link).toHaveTextContent(en.following.lastPlayed)
})

test('their showcase, small at the foot: each badge opens its game, described by its tooltip', () => {
  render(<FollowingCard friend={friend({ showcase: [PIN, { ...PIN, gameId: 4, title: 'Velocista', description: null }] })} />)
  expect(screen.getByRole('list', { name: en.friends.showcase }).querySelectorAll('li')).toHaveLength(2)
  const badge = screen.getByRole('link', { name: 'Sin daños · Super Metroid' })
  expect(badge).toHaveAttribute('href', '/user/luna/ra/3')
  expect(badge).toHaveAccessibleDescription(/Derrota a Ridley sin daño\./)
  expect(screen.getByRole('link', { name: 'Velocista · Super Metroid' })).not.toHaveAttribute('aria-describedby')
})

test('their latest unlocks, large, up to five, each opening its game; none lately says so', () => {
  const unlock = (i: number) => ({ Date: '2026-10-19 10:00:00', HardcoreMode: '1', AchievementID: i, Title: `Logro ${i}`, Description: `Haz ${i}`, BadgeName: String(i), Points: 5, GameID: 7, GameTitle: 'Zelda', ConsoleName: 'SNES' })
  render(<FollowingCard friend={friend()} recent={[1, 2, 3, 4, 5, 6].map(unlock)} />)
  const row = screen.getByRole('list', { name: en.following.recentUnlocks })
  expect(row.querySelectorAll('li')).toHaveLength(5)
  const first = screen.getByRole('link', { name: 'Logro 1 · Zelda' })
  expect(first).toHaveAttribute('href', '/user/luna/ra/7')
  expect(first).toHaveAccessibleDescription(/Haz 1/)
})

test('read, and nothing earned lately: says so', () => {
  render(<FollowingCard friend={friend()} recent={[]} />)
  expect(screen.getByText(en.following.noRecentUnlocks)).toBeInTheDocument()
})

test('online: a dot and the word, in place of the bio', () => {
  render(<FollowingCard friend={friend({ online: true, lastSeenAt: new Date().toISOString() })} />)
  expect(screen.getByText(en.following.online)).toBeInTheDocument()
  expect(screen.queryByText('Hardcore o nada')).not.toBeInTheDocument()
})

test('offline: when they were last seen, or a while ago; nothing shared, the bio', () => {
  const { unmount } = render(<FollowingCard friend={friend({ online: false, lastSeenAt: new Date(Date.now() - 3 * 3600e3).toISOString() })} />)
  expect(screen.getByText(/^Seen .*3 hr/)).toBeInTheDocument()
  unmount()
  const old = render(<FollowingCard friend={friend({ online: false, lastSeenAt: '2020-01-01T00:00:00Z' })} />)
  expect(screen.getByText(en.following.seenLongAgo)).toBeInTheDocument()
  old.unmount()
  render(<FollowingCard friend={friend({ online: false, lastSeenAt: null })} />)
  expect(screen.getByText('Hardcore o nada')).toBeInTheDocument()
  expect(screen.queryByText(en.following.online)).not.toBeInTheDocument()
})
