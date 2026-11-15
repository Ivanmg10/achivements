import { crowdedAccounts, daysUntil, suggestRenewal, summarizePsnPool } from './psnPool'
import { DAY_MS, NOW, psnAccount } from '@/test-utils/psnPoolFixtures'

const dies = (id: number, days: number) => psnAccount({ id, label: `PSN-${id}`, npssoExpiresAt: NOW + days * DAY_MS })

test('days until a deadline: whole days, never negative, null when unknown', () => {
  expect(daysUntil(NOW + 2.5 * DAY_MS, NOW)).toBe(2)
  expect(daysUntil(NOW - DAY_MS, NOW)).toBe(0)
  expect(daysUntil(null, NOW)).toBeNull()
})

test('sign-ins that die within 7 days of each other are flagged; an unknown expiry never is', () => {
  expect(crowdedAccounts([dies(1, 10), dies(2, 15), dies(3, 40), psnAccount({ id: 4, npssoExpiresAt: null })])).toEqual([1, 2])
  expect(crowdedAccounts([dies(1, 10)])).toEqual([])
})

test('one account: renew it 3 days before it dies', () => {
  expect(suggestRenewal([dies(1, 20)], NOW)).toEqual({ accountId: 1, label: 'PSN-1', at: NOW + 17 * DAY_MS })
})

test('the first to die is renewed on a day whose new 60 days end far from the others', () => {
  // PSN-1 dies in 20 days; renewing it 3 days before would make it die on day 77, 2 days from PSN-2 (79).
  const s = suggestRenewal([dies(1, 20), dies(2, 79)], NOW)!
  expect(s.accountId).toBe(1)
  const newDeath = (s.at - NOW) / DAY_MS + 60
  expect(Math.abs(newDeath - 79)).toBeGreaterThanOrEqual(12)
  expect(s.at).toBeLessThanOrEqual(NOW + 17 * DAY_MS)
})

test('when no day spaces them, the latest safe day; nothing dated, no suggestion', () => {
  expect(suggestRenewal([dies(1, 1), dies(2, 61)], NOW)).toEqual({ accountId: 1, label: 'PSN-1', at: NOW })
  expect(suggestRenewal([psnAccount({ npssoExpiresAt: null })], NOW)).toBeNull()
})

test('the summary counts states, rests, 429s and the next sign-in to die (a paused one aside)', () => {
  const s = summarizePsnPool(
    [
      dies(1, 30),
      psnAccount({ id: 2, label: 'PSN-2', cooldownUntil: NOW + 60_000, callsLastHour: 90, rateLimitedLastHour: 9 }),
      psnAccount({ id: 3, label: 'PSN-3', status: 'quarantined', npssoExpiresAt: NOW + 5 * DAY_MS }),
      psnAccount({ id: 4, label: 'PSN-4', status: 'paused', npssoExpiresAt: NOW + DAY_MS }),
      psnAccount({ id: 5, label: 'PSN-5', status: 'draining', callsLastHour: 10 }),
    ],
    { failed: 1, total: 4 },
    NOW,
  )
  expect(s).toMatchObject({ accounts: 5, active: 2, usable: 1, cooling: 1, quarantined: 1, paused: 1, draining: 1, callsLastHour: 100, rateLimitedLastHour: 9, rateLimitedPct: 9, syncFailed: 1, syncTotal: 4 })
  expect(s.nextExpiry).toMatchObject({ label: 'PSN-3', daysLeft: 5 })
  expect(s.suggestion?.label).toBe('PSN-3')
})

test('an empty pool: zeros, no expiry, no suggestion', () => {
  expect(summarizePsnPool([], { failed: 0, total: 0 }, NOW)).toMatchObject({ accounts: 0, usable: 0, rateLimitedPct: 0, nextExpiry: null, suggestion: null, crowded: [] })
})
