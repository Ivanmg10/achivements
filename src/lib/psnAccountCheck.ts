import { getProfileFromAccountId, getUserTrophyProfileSummary, type AuthorizationPayload } from 'psn-api'
import { canaryDue, npssoExpiry, recordPsnCanary, type PoolAccount, type PsnSignIn } from '@/lib/psnAccounts'
import { spendPsnCall } from '@/lib/psnBudget'
import { recordPsnCall, type PsnFunction } from '@/lib/psnCallStats'
import { PsnError, TIMED_OUT } from '@/lib/psnErrors'
import { exchangeNpsso, forgetPsnAccountTokens, psnAuthorization } from '@/lib/psnTokens'
import { avatarUrl } from '@/utils/psnTitles'

/**
 * Proving a PSN service account works (#178): it signs in and reads its own profile with its own token, which
 * also says who it is (its online ID: `psn_credentials` never stored a name). Used to test an NPSSO before it is
 * saved, by the panel's "Test", and by the canary every 30 minutes.
 */

export type PsnOwnProfile = { onlineId: string; avatarUrl: string | null }
export type PsnCheck = { ok: true; profile: PsnOwnProfile; ms: number } | { ok: false; error: 'auth' | 'rate-limited' | 'failed' }

const TIMEOUT_MS = 8_000
const CANARY_EVERY_MS = 30 * 60_000
/** Canaries run two accounts at a time, with a pause between, so the accounts never refresh all at once. */
const BATCH = 2
const PAUSE_MS = 500

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** A Sony answer within the deadline, its error body turned into a PsnError. */
async function answer<T>(request: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PsnError('PSN did not answer in time', TIMED_OUT)), TIMEOUT_MS)
  })
  try {
    const res = await Promise.race([request, deadline])
    const error = (res as { error?: { message?: string; code?: number } } | null)?.error
    if (error) throw new PsnError(error.message ?? 'PSN error', error.code)
    return res
  } finally {
    clearTimeout(timer)
  }
}

/** The signed-in account's own profile: its trophy summary ("me") gives its id, the profile its name. Two calls. */
async function readOwnProfile(auth: AuthorizationPayload, spend: (fn: PsnFunction) => Promise<void>): Promise<PsnOwnProfile> {
  await spend('summary')
  const summary = await answer(getUserTrophyProfileSummary(auth, 'me'))
  await spend('profile')
  const profile = await answer(getProfileFromAccountId(auth, summary.accountId))
  return { onlineId: profile.onlineId, avatarUrl: avatarUrl(profile.avatars ?? []) }
}

const kind = (err: unknown): 'auth' | 'rate-limited' | 'failed' =>
  err instanceof PsnError && err.isAuth ? 'auth' : err instanceof PsnError && err.isRateLimited ? 'rate-limited' : 'failed'

/**
 * Tests an NPSSO before it is stored: Sony gives its expiry, it signs in, and the account reads its own profile.
 * 'rejected' when Sony does not take it, 'failed' when Sony could not be asked. The NPSSO is never logged.
 */
export async function tryPsnNpsso(npsso: string): Promise<PsnSignIn | 'rejected' | 'failed'> {
  const expiresAt = await npssoExpiry(npsso)
  if (expiresAt === null) return 'rejected'
  try {
    const tokens = await exchangeNpsso(npsso)
    const profile = await readOwnProfile({ accessToken: tokens.accessToken }, async (fn) => recordPsnCall(fn))
    return { npsso, expiresAt, tokens, ...profile }
  } catch (err) {
    if (kind(err) === 'auth') return 'rejected'
    console.error('[psn] testing an NPSSO failed', err instanceof Error ? err.message : 'unknown')
    return 'failed'
  }
}

/** One stored account reads its own profile with its own token (refreshing it when due); the answer is recorded. */
export async function checkPsnAccount(account: PoolAccount): Promise<PsnCheck> {
  const started = Date.now()
  try {
    const profile = await readOwnProfile(await psnAuthorization(account), (fn) => spendPsnCall(account, fn))
    await recordPsnCanary(account.id, profile)
    return { ok: true, profile, ms: Date.now() - started }
  } catch (err) {
    const error = kind(err)
    console.error('[psn] canary failed', account.label, error)
    if (error === 'auth') await forgetPsnAccountTokens(account.id).catch(() => {})
    await recordPsnCanary(account.id, null).catch((e) => console.error('[psn] could not record the canary', e))
    return { ok: false, error }
  }
}

/** The canaries that are due (every 30 minutes per active account), two accounts at a time. How many ran. */
export async function runPsnCanaries(): Promise<number> {
  const due = await canaryDue(CANARY_EVERY_MS)
  for (let i = 0; i < due.length; i += BATCH) {
    if (i > 0) await sleep(PAUSE_MS + Math.random() * PAUSE_MS * 3)
    await Promise.all(due.slice(i, i + BATCH).map(checkPsnAccount))
  }
  return due.length
}
