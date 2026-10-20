import type { RecentAchievement } from '@/types/types'
import type { LibraryGame } from '@/utils/library'
import { friendStats, friendsFeed, rankBy, sharedWithFriends, type LeaderRow } from './friends'

const NOW = Date.parse('2026-10-14T12:00:00Z')
const at = (Date: string, Title = 'A') => ({ Date, Title }) as RecentAchievement
const lib = (key: string, pct: number): LibraryGame => {
  const [source, id] = key.split(':')
  return { key, source: source as LibraryGame['source'], id: Number(id), title: key, subtitle: '', status: pct >= 100 ? 'completed' : 'playing', pct, href: '' }
}

describe('friendStats', () => {
  test('unlocks this week, active days and the streak up to today', () => {
    const s = friendStats(
      [at('2026-10-14 08:00:00'), at('2026-10-13 08:00:00'), at('2026-10-13 09:00:00'), at('2026-10-12 08:00:00'), at('2026-10-05 08:00:00'), at('2026-09-01 08:00:00')],
      [lib('ra:1', 100), lib('ra:2', 40)],
      NOW,
    )
    expect(s).toEqual({ week: 4, activeDays: 4, streak: 3, streakCapped: false, completed: 1, played: 2 })
  })

  test('a streak with nothing yet today still counts up to yesterday; a gap ends it', () => {
    expect(friendStats([at('2026-10-13 08:00:00'), at('2026-10-12 08:00:00'), at('2026-10-10 08:00:00')], [], NOW).streak).toBe(2)
    expect(friendStats([at('2026-10-11 08:00:00')], [], NOW).streak).toBe(0)
  })

  test('a streak as long as the window may be longer: it says so', () => {
    const every = Array.from({ length: 20 }, (_, i) => at(new Date(NOW - i * 86400000).toISOString().slice(0, 10) + ' 08:00:00'))
    expect(friendStats(every, [], NOW)).toMatchObject({ streak: 14, streakCapped: true })
  })

  test('an unreadable date is skipped', () => {
    expect(friendStats([at('garbage')], [], NOW).week).toBe(0)
  })
})

test('ranks on the chosen measure, ties by streak then name', () => {
  const row = (username: string, week: number, streak: number): LeaderRow => ({
    username, avatar: null, isMe: false, stats: { week, streak, activeDays: 0, streakCapped: false, completed: 0, played: 0 },
  })
  expect(rankBy([row('b', 5, 1), row('a', 5, 1), row('c', 5, 3), row('d', 9, 0)], 'week').map((r) => r.username)).toEqual(['d', 'c', 'a', 'b'])
})

test('shared games: yours that friends play too, the most shared first', () => {
  const rows = sharedWithFriends(
    [lib('ra:1', 50), lib('ra:2', 10), lib('steam:3', 0)],
    [
      { username: 'x', avatar: null, games: [lib('ra:1', 80), lib('ra:2', 20)] },
      { username: 'y', avatar: 'a.png', games: [lib('ra:2', 100)] },
    ],
  )
  expect(rows.map((r) => [r.game.key, r.friends.map((f) => `${f.username}:${f.pct}`)])).toEqual([
    ['ra:2', ['x:20', 'y:100']],
    ['ra:1', ['x:80']],
  ])
  expect(sharedWithFriends([lib('ra:1', 1)], [], 5)).toEqual([])
})

test('the feed is everyone together, newest first, capped', () => {
  const feed = friendsFeed(
    [
      { username: 'x', avatar: null, recent: [at('2026-10-10 10:00:00', 'old'), at('2026-10-14 10:00:00', 'new')] },
      { username: 'y', avatar: null, recent: [at('2026-10-12 10:00:00', 'mid')] },
    ],
    2,
  )
  expect(feed.map((f) => `${f.username}:${f.achievement.Title}`)).toEqual(['x:new', 'y:mid'])
})

test('among games shared by as many, the ones still to finish come first', () => {
  const rows = sharedWithFriends([lib('ra:1', 100), lib('ra:2', 30)], [{ username: 'x', avatar: null, games: [lib('ra:1', 100), lib('ra:2', 100)] }])
  expect(rows.map((r) => r.game.key)).toEqual(['ra:2', 'ra:1'])
})
