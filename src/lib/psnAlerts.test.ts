/** @jest-environment node */
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/psnPoolStatus', () => ({ ...jest.requireActual('@/lib/psnPoolStatus'), psnPoolStatus: jest.fn(), prePoolStatus: jest.fn() }))
jest.mock('@/lib/telegram', () => ({ ...jest.requireActual('@/lib/telegram'), sendTelegram: jest.fn() }))

import pool from '@/lib/db'
import { prePoolStatus, psnPoolStatus } from '@/lib/psnPoolStatus'
import { sendTelegram } from '@/lib/telegram'
import { dueAlerts, sendPsnAlerts } from './psnAlerts'
import { DAY_MS, NOW, psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'
import type { PsnMetrics } from '@/types/psnPool'

const query = pool.query as jest.Mock
const kinds = (status = psnStatus([])) => dueAlerts(status, NOW).map((a) => `${a.kind.replace(/-\d{4}-\d\d-\d\d$/, '')}:${a.accountId}`)
const MORNING = Date.UTC(2026, 10, 15, 10)
const NIGHT = Date.UTC(2026, 10, 15, 3)

beforeEach(() => {
  jest.clearAllMocks()
  process.env.VERCEL_ENV = 'production'
  process.env.TELEGRAM_BOT_TOKEN = 'bot'
  process.env.TELEGRAM_CHAT_ID = 'chat'
  query.mockResolvedValue({ rows: [] })
  ;(sendTelegram as jest.Mock).mockResolvedValue('sent')
  ;(prePoolStatus as jest.Mock).mockResolvedValue(null)
})

afterEach(() => {
  delete process.env.VERCEL_ENV
  delete process.env.TELEGRAM_BOT_TOKEN
  delete process.env.TELEGRAM_CHAT_ID
})

describe('what is due', () => {
  test('an NPSSO at the 14, 7, 3 and 1 day steps, per account; a paused one is left alone', () => {
    const at = (days: number, over = {}) => psnAccount({ npssoExpiresAt: NOW + days * DAY_MS + 1000, ...over })
    expect(kinds(psnStatus([at(20)]))).toEqual([])
    expect(kinds(psnStatus([at(14)]))).toEqual(['npsso-14:1'])
    expect(kinds(psnStatus([at(6)]))).toEqual(['npsso-7:1'])
    expect(kinds(psnStatus([at(0, { id: 2 })]))).toEqual(['npsso-1:2'])
    expect(kinds(psnStatus([at(2, { status: 'paused' })]))).toEqual([])
  })

  test('the NPSSO step is keyed by the expiry, so a renewed sign-in is warned about again', () => {
    const a = dueAlerts(psnStatus([psnAccount({ npssoExpiresAt: NOW + 3 * DAY_MS })]), NOW)[0]
    expect(a.kind).toBe('npsso-3-2026-11-18')
  })

  test('a quarantined account', () => {
    expect(kinds(psnStatus([psnAccount({ status: 'quarantined' })]))).toEqual(['quarantined:1'])
  })

  describe('from the numbers (#180)', () => {
    const QUIET: PsnMetrics = { accounts: [], calls5m: 0, rateLimited5m: 0, sonyP95Ms: null, readP95Ms: null, reads15m: 0, readsServedPct: null, queue: { due: 0, queued: 0, running: 0, lagP95Ms: null, lagSamples: 0 } }
    const withMetrics = (m: Partial<PsnMetrics>) => ({ ...psnStatus([psnAccount()]), metrics: { ...QUIET, ...m } })

    test('429s above 1 % in the last 5 minutes, once there are calls enough to say so', () => {
      expect(kinds(withMetrics({ calls5m: 100, rateLimited5m: 2 }))).toEqual(['rate-limited:0'])
      expect(kinds(withMetrics({ calls5m: 100, rateLimited5m: 1 }))).toEqual([])
      expect(kinds(withMetrics({ calls5m: 10, rateLimited5m: 9 }))).toEqual([])
    })

    test('the queue late by more than 15 minutes at p95, with jobs enough', () => {
      expect(kinds(withMetrics({ queue: { ...QUIET.queue, lagP95Ms: 16 * 60_000, lagSamples: 5, due: 30 } }))).toEqual(['queue-slow:0'])
      expect(kinds(withMetrics({ queue: { ...QUIET.queue, lagP95Ms: 16 * 60_000, lagSamples: 2 } }))).toEqual([])
      expect(kinds(withMetrics({ queue: { ...QUIET.queue, lagP95Ms: 10 * 60_000, lagSamples: 50 } }))).toEqual([])
    })

    test('page reads slower than 1 s at p95, with reads enough', () => {
      expect(kinds(withMetrics({ readP95Ms: 1200, reads15m: 40 }))).toEqual(['reads-slow:0'])
      expect(kinds(withMetrics({ readP95Ms: 1200, reads15m: 5 }))).toEqual([])
      expect(kinds(withMetrics({ readP95Ms: 800, reads15m: 400 }))).toEqual([])
    })
  })

  test('fewer than two usable accounts: silent with one account by design, loud once two are meant to serve', () => {
    expect(kinds(psnStatus([psnAccount()]))).toEqual([])
    expect(kinds(psnStatus([psnAccount({ cooldownUntil: NOW + 60_000 })]))).toEqual([])
    const two = [psnAccount(), psnAccount({ id: 2, label: 'PSN-2', status: 'quarantined' })]
    expect(kinds(psnStatus(two))).toEqual(['quarantined:2', 'pool-low:0'])
    // One paused on purpose: back to one meant to serve, silent.
    expect(kinds(psnStatus([psnAccount(), psnAccount({ id: 2, status: 'paused' })]))).toEqual([])
  })

  test('failing syncs above 5 %, with jobs enough to say so', () => {
    expect(kinds(psnStatus([psnAccount()], { failed: 2, total: 20 }))).toEqual(['sync-failures:0'])
    expect(kinds(psnStatus([psnAccount()], { failed: 1, total: 20 }))).toEqual([])
    expect(kinds(psnStatus([psnAccount()], { failed: 5, total: 10 }))).toEqual([])
  })
})

describe('sending', () => {
  const quarantined = psnStatus([psnAccount({ status: 'quarantined' })])

  test('only production sends, and only with Telegram set up', async () => {
    process.env.VERCEL_ENV = 'preview'
    expect(await sendPsnAlerts(NIGHT)).toEqual({ skipped: 'not-production' })
    delete process.env.VERCEL_ENV
    expect(await sendPsnAlerts(NIGHT)).toEqual({ skipped: 'not-production' })
    process.env.VERCEL_ENV = 'production'
    delete process.env.TELEGRAM_CHAT_ID
    expect(await sendPsnAlerts(NIGHT)).toEqual({ skipped: 'not-configured' })
    expect(sendTelegram).not.toHaveBeenCalled()
  })

  test('the alerts of production go out tagged PRO in one message, and are remembered', async () => {
    ;(psnPoolStatus as jest.Mock).mockResolvedValue(quarantined)
    expect(await sendPsnAlerts(NIGHT)).toEqual({ PRO: { sent: 1, result: 'sent' } })
    expect((sendTelegram as jest.Mock).mock.calls[0][0]).toMatch(/^\[PRO\] CheevoVault, cuentas de PSN\n\nPSN-1 está en cuarentena/)
    const insert = query.mock.calls.find((c) => String(c[0]).includes('INSERT INTO psn_alert_state'))!
    expect(insert[1]).toEqual([['quarantined'], [1]])
  })

  test('an alert sent recently is not sent again; after its repeat time it is', async () => {
    ;(psnPoolStatus as jest.Mock).mockResolvedValue(quarantined)
    query.mockResolvedValueOnce({ rows: [{ kind: 'quarantined', account_id: 1, last_sent_at: new Date(NIGHT - 3_600_000) }] })
    expect(await sendPsnAlerts(NIGHT)).toEqual({ PRO: { sent: 0, result: 'nothing' } })
    query.mockResolvedValueOnce({ rows: [{ kind: 'quarantined', account_id: 1, last_sent_at: new Date(NIGHT - 25 * 3_600_000) }] })
    expect((await sendPsnAlerts(NIGHT)).PRO).toEqual({ sent: 1, result: 'sent' })
  })

  test('a message Telegram did not take is not remembered, so it goes again next time', async () => {
    ;(psnPoolStatus as jest.Mock).mockResolvedValue(quarantined)
    ;(sendTelegram as jest.Mock).mockResolvedValue('failed')
    expect((await sendPsnAlerts(NIGHT)).PRO).toEqual({ sent: 0, result: 'failed' })
    expect(query.mock.calls.some((c) => String(c[0]).includes('INSERT'))).toBe(false)
  })

  test('the digest joins after 09:00 UTC, once a day; never for an empty pool', async () => {
    ;(psnPoolStatus as jest.Mock).mockResolvedValue(psnStatus([psnAccount()]))
    await sendPsnAlerts(MORNING)
    expect((sendTelegram as jest.Mock).mock.calls[0][0]).toContain('Resumen del 15 nov')
    ;(psnPoolStatus as jest.Mock).mockResolvedValue(psnStatus([]))
    expect((await sendPsnAlerts(MORNING)).PRO).toEqual({ sent: 0, result: 'nothing' })
  })

  test('the pool of pre, read by production, goes in its own message tagged PRE, remembered under pre:', async () => {
    ;(psnPoolStatus as jest.Mock).mockResolvedValue(psnStatus([]))
    ;(prePoolStatus as jest.Mock).mockResolvedValue(quarantined)
    expect(await sendPsnAlerts(NIGHT)).toEqual({ PRO: { sent: 0, result: 'nothing' }, PRE: { sent: 1, result: 'sent' } })
    expect((sendTelegram as jest.Mock).mock.calls[0][0]).toMatch(/^\[PRE\] /)
    const insert = query.mock.calls.find((c) => String(c[0]).includes('INSERT INTO psn_alert_state'))!
    expect(insert[1]).toEqual([['pre:quarantined'], [1]])
  })

  test('a pre pool that cannot be read does not stop the alerts of production', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(psnPoolStatus as jest.Mock).mockResolvedValue(quarantined)
    ;(prePoolStatus as jest.Mock).mockRejectedValue(new Error('pre down'))
    expect(await sendPsnAlerts(NIGHT)).toEqual({ PRO: { sent: 1, result: 'sent' }, PRE: { sent: 0, result: 'failed-to-read' } })
    ;(console.error as jest.Mock).mockRestore()
  })
})
