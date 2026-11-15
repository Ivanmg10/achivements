jest.mock('@/lib/attemptLimit', () => ({ reserveAttempt: jest.fn() }))
jest.mock('@/lib/upstreamCount', () => ({ countUpstream: jest.fn() }))

import { reserveAttempt } from '@/lib/attemptLimit'
import { countUpstream } from '@/lib/upstreamCount'
import { psnCallTotals, resetPsnCallStats } from './psnCallStats'
import { PsnBusyError } from './psnErrors'
import { psnBackground, spendPsnCall, takePsnCall } from './psnBudget'

const reserve = reserveAttempt as jest.Mock
const release = jest.fn()
const ACCOUNT = { id: 3, ratePerMin: 40 }

beforeEach(() => {
  jest.clearAllMocks()
  resetPsnCallStats()
  reserve.mockResolvedValue({ allowed: true, release })
})

test("a call takes one from its account's budget: 40 a minute is 600 in the 15-minute window", async () => {
  expect(await takePsnCall(ACCOUNT)).toBe(true)
  expect(reserve).toHaveBeenCalledWith('psn-upstream', 'account:3', 600)
})

test('each account has its own budget, sized by its rate', async () => {
  await takePsnCall({ id: 4, ratePerMin: 20 })
  expect(reserve).toHaveBeenCalledWith('psn-upstream', 'account:4', 300)
})

test('background work may spend only three quarters of it, so a page always has room', async () => {
  await psnBackground(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await takePsnCall(ACCOUNT)
  })
  expect(reserve).toHaveBeenCalledWith('psn-upstream', 'account:3', 450)
  await takePsnCall(ACCOUNT)
  expect(reserve).toHaveBeenLastCalledWith('psn-upstream', 'account:3', 600)
})

test('a refused call is given back, so hammering does not lengthen the wait', async () => {
  reserve.mockResolvedValue({ allowed: false, release })
  expect(await takePsnCall(ACCOUNT)).toBe(false)
  expect(release).toHaveBeenCalled()
})

test('spending counts the call under its function, or throws PsnBusyError without counting it', async () => {
  await spendPsnCall(ACCOUNT, 'titles')
  expect(psnCallTotals()).toEqual({ titles: 1 })
  expect(countUpstream).toHaveBeenCalledWith('psn')
  reserve.mockResolvedValue({ allowed: false, release })
  await expect(spendPsnCall(ACCOUNT, 'titles')).rejects.toBeInstanceOf(PsnBusyError)
  expect(psnCallTotals()).toEqual({ titles: 1 })
})
