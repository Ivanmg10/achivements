import { renderHook, waitFor } from '@testing-library/react'
import { useGroupCountsSync } from './useGroupCountsSync'
import type { GameGroupItem } from '@/types/types'
import type { ItemProgress, PtsStats } from '@/utils/groupItems'

const item = (over: Partial<GameGroupItem>): GameGroupItem => ({
  id: 1, source: 'steam', game_id: 22380, title: 'Fallout: New Vegas', image_icon: null, console_name: 'Steam', pct_won: '0.5',
  num_awarded: 40, max_possible: 75, points_won: 0, max_points: 0, position: 0, added_at: '2026-01-01', release_year: 2010,
  ...over,
})
const patches = () => (global.fetch as jest.Mock).mock.calls.filter(([, init]) => init?.method === 'PATCH').map(([url, init]) => [url, JSON.parse(init.body)])

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

test('a game whose live numbers moved past the stored ones is saved, so the groups list says what the page says', async () => {
  const items = [item({}), item({ id: 2, game_id: 1, title: 'Same', num_awarded: 3, max_possible: 9 })]
  const live = (i: GameGroupItem): ItemProgress => (i.game_id === 22380 ? { earned: 41, total: 75, pct: 41 / 75 } : { earned: 3, total: 9, pct: 1 / 3 })
  renderHook(() => useGroupCountsSync(9, items, live, new Map()))
  await waitFor(() => expect(patches()).toHaveLength(1))
  expect(patches()[0]).toEqual(['/api/groups/9/games', [{ source: 'steam', game_id: 22380, num_awarded: 41, max_possible: 75, points_won: 0, max_points: 0 }]])
})

test('sent once per value, again only when the value moves', async () => {
  const items = [item({})]
  let earned = 41
  const { rerender } = renderHook(({ p }) => useGroupCountsSync(9, items, p, new Map()), {
    initialProps: { p: (): ItemProgress => ({ earned, total: 75, pct: 0 }) },
  })
  rerender({ p: (): ItemProgress => ({ earned, total: 75, pct: 0 }) })
  expect(patches()).toHaveLength(1)
  earned = 42
  rerender({ p: (): ItemProgress => ({ earned, total: 75, pct: 0 }) })
  await waitFor(() => expect(patches()).toHaveLength(2))
})

test('RA games take their live points; a live entry with no total is left alone', async () => {
  const items = [item({ source: 'ra', game_id: 10, num_awarded: 5, max_possible: 20, points_won: 50, max_points: 200 }), item({ id: 2, source: 'xbox', game_id: 7 })]
  const points = new Map<number, PtsStats>([[10, { earned: 80, total: 200 }]])
  const live = (i: GameGroupItem): ItemProgress => (i.source === 'ra' ? { earned: 8, total: 20, pct: 0.4 } : { earned: 3, total: 0, pct: 0.2 })
  renderHook(() => useGroupCountsSync(9, items, live, points))
  await waitFor(() => expect(patches()).toHaveLength(1))
  expect(patches()[0][1]).toEqual([{ source: 'ra', game_id: 10, num_awarded: 8, max_possible: 20, points_won: 80, max_points: 200 }])
})

test('a failed save is only logged: the page already shows the fresh numbers', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {})
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })
  renderHook(() => useGroupCountsSync(9, [item({})], () => ({ earned: 41, total: 75, pct: 0 }), new Map()))
  await waitFor(() => expect(error).toHaveBeenCalled())
  error.mockRestore()
})
