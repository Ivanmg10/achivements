jest.mock('@/lib/psnAccounts', () => ({ tidyPsnPool: jest.fn(async () => {}) }))
jest.mock('@/lib/psnAccountCheck', () => ({ runPsnCanaries: jest.fn(async () => 2) }))
jest.mock('@/lib/psnAlerts', () => ({ sendPsnAlerts: jest.fn(async () => ({ skipped: 'not-production' })) }))
jest.mock('@/lib/runLater', () => ({ runLater: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({ takeLease: jest.fn() }))

import { tidyPsnPool } from '@/lib/psnAccounts'
import { runPsnCanaries } from '@/lib/psnAccountCheck'
import { sendPsnAlerts } from '@/lib/psnAlerts'
import { runLater } from '@/lib/runLater'
import { takeLease } from '@/lib/steamCache'
import { maybeMaintainPsnPool, runPsnMaintenance } from './psnMaintenance'

beforeEach(() => jest.clearAllMocks())

test('the upkeep tidies, runs the canaries due, then the alerts', async () => {
  expect(await runPsnMaintenance()).toEqual({ canaries: 2, alerts: { skipped: 'not-production' } })
  expect(tidyPsnPool).toHaveBeenCalled()
  expect(runPsnCanaries).toHaveBeenCalled()
  expect(sendPsnAlerts).toHaveBeenCalled()
})

test('PSN traffic starts it after the answer, at most every 5 minutes per instance and 15 for the app', async () => {
  maybeMaintainPsnPool(1_000_000)
  maybeMaintainPsnPool(1_000_000 + 60_000)
  expect(runLater).toHaveBeenCalledTimes(1)
  const task = (runLater as jest.Mock).mock.calls[0][0] as () => Promise<void>

  ;(takeLease as jest.Mock).mockResolvedValueOnce(false)
  await task()
  expect(takeLease).toHaveBeenCalledWith('psn:maintenance', 15 * 60_000)
  expect(tidyPsnPool).not.toHaveBeenCalled()

  ;(takeLease as jest.Mock).mockResolvedValueOnce(true)
  await task()
  expect(tidyPsnPool).toHaveBeenCalled()

  maybeMaintainPsnPool(1_000_000 + 5 * 60_000)
  expect(runLater).toHaveBeenCalledTimes(2)
})
