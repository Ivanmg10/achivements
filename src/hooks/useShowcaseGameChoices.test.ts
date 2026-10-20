import { act, renderHook, waitFor } from '@testing-library/react'
import { useShowcaseGameChoices } from './useShowcaseGameChoices'
import { fetchShared } from '@/lib/fetchShared'
import type { LibraryGame } from '@/utils/library'

jest.mock('@/lib/fetchShared', () => ({ fetchShared: jest.fn() }))

const game = (source: LibraryGame['source'], id: number): LibraryGame => ({ key: `${source}:${id}`, source, id, title: 'G', subtitle: '', status: 'playing', pct: 50, href: '' })
const answer = (body: unknown, ok = true) => (fetchShared as jest.Mock).mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('RA: the game’s achievements through its progression, earned by date', async () => {
  answer({ Achievements: { 1: { ID: 1, Title: 'A', Description: 'd', BadgeName: '9', DisplayOrder: 1, DateEarned: '2026-10-01 10:00:00' }, 2: { ID: 2, Title: 'B', BadgeName: '8', DisplayOrder: 2 } } })
  const { result } = renderHook(() => useShowcaseGameChoices(game('ra', 3)))
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchShared).toHaveBeenCalledWith('/api/getGameProgression?gameId=3')
  expect(result.current.choices.map((c) => [c.key, Boolean(c.entry)])).toEqual([['1', true], ['2', false]])
})

test('Steam, PSN and Xbox through their own routes', async () => {
  answer([{ apiname: 'WIN', title: 'Win', description: '', badgeUrl: 'https://b/w.jpg', earned: true, dateEarned: '2026-10-01T00:00:00Z', hidden: false }])
  const steam = renderHook(() => useShowcaseGameChoices(game('steam', 620)))
  await waitFor(() => expect(steam.result.current.choices).toHaveLength(1))
  expect((fetchShared as jest.Mock).mock.calls[0][0]).toMatch(/^\/api\/steam\/achievements\?appid=620&lang=/)

  answer({ trophies: [{ id: 4, name: 'T', detail: '', iconUrl: 'https://b/t.png', earned: false, earnedAt: null, hidden: true }] })
  const psn = renderHook(() => useShowcaseGameChoices(game('psn', 2018800)))
  await waitFor(() => expect(psn.result.current.choices).toHaveLength(1))
  expect((fetchShared as jest.Mock).mock.calls[1][0]).toMatch(/^\/api\/psn\/trophies\?id=NPWR20188_00&lang=/)
  expect(psn.result.current.choices[0].concealed).toBe(true)

  answer({ achievements: [{ id: '7', name: 'X', description: '', iconUrl: null, unlocked: true, unlockedAt: '2026-10-02T00:00:00Z', secret: false }] })
  const xbox = renderHook(() => useShowcaseGameChoices(game('xbox', 99)))
  await waitFor(() => expect(xbox.result.current.choices).toHaveLength(1))
  expect((fetchShared as jest.Mock).mock.calls[2][0]).toMatch(/^\/api\/xbox\/achievements\?id=99&lang=/)
})

test('a failure is an error; retry asks again', async () => {
  answer({}, false)
  const { result } = renderHook(() => useShowcaseGameChoices(game('ra', 3)))
  await waitFor(() => expect(result.current.error).toBe(true))
  answer({ Achievements: {} })
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.error).toBe(false))
  expect(fetchShared).toHaveBeenCalledTimes(2)
})
