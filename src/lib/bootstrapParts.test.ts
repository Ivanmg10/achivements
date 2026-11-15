jest.mock('@/lib/fetchShared', () => ({ fetchShared: jest.fn() }))

import { bootstrapPart, resetBootstrap } from './bootstrapParts'
import { fetchShared } from '@/lib/fetchShared'

const BOOT = { preferences: { 'home-layout': 'cover' }, hiddenGames: [], vault: null }
const answer = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body })

beforeEach(() => {
  jest.clearAllMocks()
  resetBootstrap()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetchShared as jest.Mock).mockResolvedValue(answer(BOOT))
})

afterEach(() => jest.useRealTimers())

test('every part of one start-up comes from one request', async () => {
  expect(await bootstrapPart('7', 'preferences')).toEqual({ 'home-layout': 'cover' })
  expect(await bootstrapPart('7', 'hiddenGames')).toEqual([])
  expect(fetchShared).toHaveBeenCalledTimes(1)
  expect(fetchShared).toHaveBeenCalledWith('/api/me/bootstrap', { cache: 'no-store' })
})

test('a part that failed on the server is null, so its reader asks its own route', async () => {
  expect(await bootstrapPart('7', 'vault')).toBeNull()
})

test('a failed bootstrap is null for every part, said in the console', async () => {
  ;(fetchShared as jest.Mock).mockResolvedValue(answer({}, false))
  expect(await bootstrapPart('7', 'preferences')).toBeNull()
  expect(console.error).toHaveBeenCalled()
})

test('a reader that mounts later asks its own route; another account starts again', async () => {
  jest.useFakeTimers()
  await bootstrapPart('7', 'preferences')
  jest.advanceTimersByTime(11_000)
  expect(await bootstrapPart('7', 'vault')).toBeNull()
  expect(fetchShared).toHaveBeenCalledTimes(1)
  await bootstrapPart('8', 'preferences')
  expect(fetchShared).toHaveBeenCalledTimes(2)
})
