jest.mock('@/lib/fetchShared', () => ({ fetchShared: jest.fn() }))

import { fetchShared } from '@/lib/fetchShared'
import { fetchUntilReady } from './fetchUntilReady'

const answer = (status: number, retryAfter?: string) => ({ status, headers: { get: (h: string) => (h === 'Retry-After' ? (retryAfter ?? null) : null) } }) as unknown as Response

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
})
afterEach(() => jest.useRealTimers())

test('a real answer comes back at once', async () => {
  ;(fetchShared as jest.Mock).mockResolvedValue(answer(200))
  expect((await fetchUntilReady('/a', undefined, () => true)).status).toBe(200)
  expect(fetchShared).toHaveBeenCalledTimes(1)
})

test("a 202 is waited out for its Retry-After, then asked again, until the data is there", async () => {
  ;(fetchShared as jest.Mock).mockResolvedValueOnce(answer(202, '5')).mockResolvedValueOnce(answer(202)).mockResolvedValue(answer(200))
  const pending = fetchUntilReady('/a', { cache: 'no-store' }, () => true)
  await jest.advanceTimersByTimeAsync(5_000)
  expect(fetchShared).toHaveBeenCalledTimes(2)
  // No Retry-After: 15 s.
  await jest.advanceTimersByTimeAsync(15_000)
  expect((await pending).status).toBe(200)
  expect(fetchShared).toHaveBeenLastCalledWith('/a', { cache: 'no-store' })
})

test('no longer wanted (unmounted, another account): it stops asking', async () => {
  let wanted = true
  ;(fetchShared as jest.Mock).mockResolvedValue(answer(202, '1'))
  const pending = fetchUntilReady('/a', undefined, () => wanted)
  await jest.advanceTimersByTimeAsync(0)
  wanted = false
  await jest.advanceTimersByTimeAsync(1_000)
  expect((await pending).status).toBe(202)
  expect(fetchShared).toHaveBeenCalledTimes(1)
})
