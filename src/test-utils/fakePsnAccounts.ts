import { AUTH_FAILED, PsnError } from '@/lib/psnErrors'
import type { PsnLease, PsnOutcome, PsnSecrets, PsnTokens } from '@/lib/psnAccounts'

/**
 * An in-memory stand-in for `@/lib/psnAccounts` (#178): the pool's database side, with the real psnPool and
 * psnTokens on top. `fakePsnStore.reset([...])` sets the accounts; one account, PSN-1, by default.
 *   jest.mock('@/lib/psnAccounts', () => jest.requireActual('@/test-utils/fakePsnAccounts').fakePsnStore)
 */
type FakeAccount = {
  id: number
  label: string
  ratePerMin: number
  status: 'active' | 'paused' | 'draining' | 'quarantined'
  npsso: string | null
  tokens: PsnTokens | null
  failures: number
  cooldownUntil: number
  outcomes: PsnOutcome[]
}

const accounts: FakeAccount[] = []

const account = (over: Partial<FakeAccount> & { id: number }): FakeAccount => ({
  label: `PSN-${over.id}`,
  ratePerMin: 40,
  status: 'active',
  npsso: 'npsso',
  tokens: null,
  failures: 0,
  cooldownUntil: 0,
  outcomes: [],
  ...over,
})

const ready = (a: FakeAccount, exclude: number[]) => a.status === 'active' && a.npsso !== null && a.cooldownUntil <= Date.now() && !exclude.includes(a.id)
const find = (id: number) => accounts.find((a) => a.id === id)!

export const fakePsnStore = {
  accounts,
  reset(list: (Partial<FakeAccount> & { id: number })[] = [{ id: 1 }]) {
    accounts.splice(0, accounts.length, ...list.map(account))
  },
  async leasePsnAccount(exclude: number[]): Promise<PsnLease | null> {
    const a = accounts.find((x) => ready(x, exclude))
    return a ? { account: { id: a.id, label: a.label, ratePerMin: a.ratePerMin }, slot: 0 } : null
  },
  async psnUsableRate() {
    return accounts.filter((a) => ready(a, [])).reduce((sum, a) => sum + a.ratePerMin, 0)
  },
  async psnPoolState(exclude: number[] = []) {
    if (!accounts.some((a) => a.npsso)) return 'empty'
    return accounts.some((a) => ready(a, exclude)) ? 'busy' : 'resting'
  },
  async releasePsnLease() {},
  async finishPsnLease(lease: PsnLease, outcome: PsnOutcome) {
    const a = find(lease.account.id)
    a.outcomes.push(outcome)
    if (outcome === 'ok' || outcome === 'forbidden') a.failures = 0
    if (outcome === 'rate-limited' && ++a.failures >= 2) a.cooldownUntil = Date.now() + 60_000
  },
  async lockPsnTokens(id: number, decide: (s: PsnSecrets) => Promise<PsnTokens>) {
    const a = find(id)
    try {
      a.tokens = await decide({ npsso: a.npsso, tokens: a.tokens })
      return a.tokens
    } catch (err) {
      if (err instanceof PsnError && err.code === AUTH_FAILED) a.status = 'quarantined'
      throw err
    }
  },
  async dropPsnAccessToken(id: number) {
    find(id).tokens = null
  },
  async seedPsnPool() {},
}

fakePsnStore.reset()
