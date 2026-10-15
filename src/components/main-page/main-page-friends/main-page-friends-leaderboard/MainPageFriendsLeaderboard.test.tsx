import { render, screen, fireEvent, within } from '@testing-library/react'
import MainPageFriendsLeaderboard from './MainPageFriendsLeaderboard'
import type { LeaderRow } from '@/utils/friends'
import { en } from '@/translations/en'

const row = (username: string, isMe: boolean, week: number, streak: number, capped = false): LeaderRow => ({
  username, avatar: null, isMe, stats: { week, activeDays: 3, streak, streakCapped: capped, completed: 0, played: 0 },
})
const ROWS = [row('me', true, 10, 2), row('ana', false, 25, 14, true)]
const names = () => within(screen.getByRole('list')).getAllByRole('listitem').map((li) => li.textContent)

test('ranks on unlocks this week, the leader crowned, you marked in words, friends opening the comparison', () => {
  render(<MainPageFriendsLeaderboard rows={ROWS} pending={[]} />)
  expect(names()[0]).toContain('ana')
  expect(screen.getByLabelText(en.friends.leader)).toBeInTheDocument()
  expect(screen.getByText(en.userProfile.you)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /ana/ })).toHaveAttribute('href', '/user/ana#compare')
  expect(screen.getAllByRole('link')).toHaveLength(1)
})

test('another measure re-ranks; a streak at the window edge reads as "14+"', () => {
  render(<MainPageFriendsLeaderboard rows={[row('me', true, 30, 2), row('ana', false, 5, 14, true)]} pending={[]} />)
  expect(names()[0]).toContain('me')
  fireEvent.click(screen.getByRole('button', { name: en.friends.metricStreak }))
  expect(screen.getByRole('button', { name: en.friends.metricStreak })).toHaveAttribute('aria-pressed', 'true')
  expect(names()[0]).toContain('ana')
  expect(names()[0]).toContain(en.friends.daysCapped.replace('{n}', '14'))
})

test('nobody is crowned at zero; friends still loading hold a place', () => {
  render(<MainPageFriendsLeaderboard rows={[row('me', true, 0, 0)]} pending={[{ username: 'slow', avatar: null }]} />)
  expect(screen.queryByLabelText(en.friends.leader)).not.toBeInTheDocument()
  expect(screen.getByText('slow').closest('li')).toHaveAttribute('aria-busy', 'true')
})
