import { render, screen, within } from '@testing-library/react'
import { NOW, psnAccount } from '@/test-utils/psnPoolFixtures'
import type { PsnMetrics } from '@/types/psnPool'
import AdminPsnPoolMetrics from './AdminPsnPoolMetrics'

const METRICS: PsnMetrics = {
  accounts: [{ accountId: 1, calls: 120, callsPerMin: 2, byFn: { summary: 20, titles: 100 }, rateLimited: 3, rateLimitedPct: 2.5, authErrors: 1, forbidden: 2, serverErrors: 0, p95Ms: 413 }],
  calls5m: 100,
  rateLimited5m: 2,
  sonyP95Ms: 413,
  readP95Ms: 88,
  reads15m: 40,
  readsServedPct: 92.5,
  queue: { due: 4, queued: 9, running: 1, lagP95Ms: 20 * 60_000, lagSamples: 30 },
}

test('the pool as a whole: p95s, reads served, the queue, recent 429s; and the switches', () => {
  render(<AdminPsnPoolMetrics metrics={METRICS} accounts={[psnAccount()]} switches={{ mode: 'queue', poolEnabled: true }} now={NOW} />)
  expect(screen.getAllByText('413 ms')).toHaveLength(2)
  expect(screen.getByText('92.5 %')).toBeInTheDocument()
  expect(screen.getByText('20 min')).toBeInTheDocument()
  expect(screen.getByText('2 of 100')).toBeInTheDocument()
  expect(screen.getByText(/PSN_MODE queue, pool on/)).toBeInTheDocument()
})

test('each account: calls a minute and by function, refusals by kind, p95 and days left', () => {
  render(<AdminPsnPoolMetrics metrics={METRICS} accounts={[psnAccount()]} now={NOW} />)
  const row = screen.getByRole('row', { name: /PSN-1/ })
  expect(within(row).getByText('titles 100, summary 20')).toBeInTheDocument()
  expect(within(row).getByText('2.5')).toBeInTheDocument()
  expect(within(row).getAllByText('413 ms')).toHaveLength(1)
})

test('nothing measured yet: n/a, never NaN, and no table', () => {
  const empty: PsnMetrics = { ...METRICS, accounts: [], sonyP95Ms: null, readP95Ms: null, readsServedPct: null, queue: { due: 0, queued: 0, running: 0, lagP95Ms: null, lagSamples: 0 }, calls5m: 0, rateLimited5m: 0 }
  render(<AdminPsnPoolMetrics metrics={empty} accounts={[]} now={NOW} />)
  expect(screen.getAllByText('n/a').length).toBeGreaterThanOrEqual(4)
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(document.body.textContent).not.toContain('NaN')
})
