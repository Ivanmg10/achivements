jest.mock('@/lib/attemptLimit', () => ({ PSN_CALLS_PER_WINDOW: 600, reserveAttempt: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({ readCache: jest.fn(async () => null), writeCache: jest.fn(async () => {}) }))

import { reserveAttempt } from '@/lib/attemptLimit'
import { readCache, writeCache } from '@/lib/steamCache'
import { psnBackground, psnRateLimited, takePsnCall } from './psnBudget'

const reserve = reserveAttempt as jest.Mock
const release = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  reserve.mockResolvedValue({ allowed: true, release })
})

test('a call takes one from the whole budget, for the whole app', async () => {
  expect(await takePsnCall()).toBe(true)
  expect(reserve).toHaveBeenCalledWith('psn-upstream', 'app', 600)
})

test('background work may spend only three quarters of it, so a page always has room', async () => {
  await psnBackground(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await takePsnCall()
  })
  expect(reserve).toHaveBeenCalledWith('psn-upstream', 'app', 450)
  await takePsnCall()
  expect(reserve).toHaveBeenLastCalledWith('psn-upstream', 'app', 600)
})

test('a refused call is given back, so hammering does not lengthen the wait', async () => {
  reserve.mockResolvedValue({ allowed: false, release })
  expect(await takePsnCall()).toBe(false)
  expect(release).toHaveBeenCalled()
})

test("after Sony's own refusal nobody asks for a minute, on any instance", async () => {
  await psnRateLimited()
  expect(writeCache).toHaveBeenCalledWith('psn:cooldown', expect.any(Number), 60_000)
  ;(readCache as jest.Mock).mockResolvedValueOnce(Date.now() + 60_000)
  expect(await takePsnCall()).toBe(false)
  expect(reserve).not.toHaveBeenCalled()
})
