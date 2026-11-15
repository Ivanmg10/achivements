import {
  exchangeAccessCodeForAuthTokens,
  exchangeNpssoForAccessCode,
  exchangeRefreshTokenForAuthTokens,
  type AuthorizationPayload,
  type AuthTokensResponse,
} from 'psn-api'
import { dropPsnAccessToken, lockPsnTokens, type PoolAccount, type PsnSecrets, type PsnTokens } from '@/lib/psnAccounts'
import { spendPsnCall } from '@/lib/psnBudget'
import { recordPsnCall } from '@/lib/psnCallStats'
import { AUTH_FAILED, PsnBusyError, PsnError } from '@/lib/psnErrors'

/**
 * Each service account's sign-in (#178). Cheapest first: the access token this instance holds, then the one
 * stored, then the refresh token, then a new exchange of the NPSSO. The access token (1 h) is replaced at
 * ~50 minutes, the refresh token (10 days, never renewed by Sony) at ~7 days by a new NPSSO exchange. All of
 * it is decided under `SELECT … FOR UPDATE` on the account's row (`lockPsnTokens`), so two instances never
 * refresh one account together; a refused NPSSO quarantines the account there.
 */
const ACCESS_MARGIN_MS = 10 * 60_000
const REFRESH_MARGIN_MS = 3 * 86_400_000

const held = new Map<number, PsnTokens>()
const pending = new Map<number, Promise<PsnTokens>>()

const usable = (t: PsnTokens, now = Date.now()) => t.accessExpiresAt - ACCESS_MARGIN_MS > now

function toTokens(res: AuthTokensResponse): PsnTokens {
  if (!res.accessToken) throw new PsnError('PSN refused the token exchange', AUTH_FAILED)
  const now = Date.now()
  return {
    accessToken: res.accessToken,
    accessExpiresAt: now + res.expiresIn * 1000,
    refreshToken: res.refreshToken,
    refreshExpiresAt: now + res.refreshTokenExpiresIn * 1000,
  }
}

/**
 * The two requests that turn an NPSSO into tokens, counted against `account`'s budget (none yet when an admin
 * is adding it: then only counted). A refused NPSSO is AUTH_FAILED; a network failure is thrown as it is.
 */
export async function exchangeNpsso(npsso: string, account?: PoolAccount): Promise<PsnTokens> {
  const spend = () => (account ? spendPsnCall(account, 'auth') : recordPsnCall('auth'))
  await spend()
  let code: string
  try {
    code = await exchangeNpssoForAccessCode(npsso)
  } catch (err) {
    if (err instanceof Error && /NPSSO/i.test(err.message)) throw new PsnError('PSN refused the NPSSO', AUTH_FAILED)
    throw err
  }
  await spend()
  return toTokens(await exchangeAccessCodeForAuthTokens(code))
}

async function refreshed(account: PoolAccount, known: PsnTokens): Promise<PsnTokens> {
  await spendPsnCall(account, 'auth')
  const fresh = toTokens(await exchangeRefreshTokenForAuthTokens(known.refreshToken))
  // Sony hands back the same refresh token with the same deadline; keep that deadline.
  fresh.refreshExpiresAt = Math.min(fresh.refreshExpiresAt, known.refreshExpiresAt)
  return fresh
}

/** What the row's tokens become: kept while good, refreshed, or a new sign-in with the NPSSO. */
async function nextTokens(account: PoolAccount, { npsso, tokens }: PsnSecrets): Promise<PsnTokens> {
  const now = Date.now()
  if (tokens && usable(tokens, now)) return tokens
  if (tokens && tokens.refreshExpiresAt - REFRESH_MARGIN_MS > now) {
    try {
      return await refreshed(account, tokens)
    } catch (err) {
      if (err instanceof PsnBusyError) throw err
      console.error('[psn] refresh failed, signing in again with the NPSSO', account.label)
    }
  }
  if (!npsso) throw new PsnError('PSN account has no NPSSO', AUTH_FAILED)
  return exchangeNpsso(npsso, account)
}

/** The account's tokens, refreshed when due (one refresh at a time per account on this instance). */
export async function psnAccountTokens(account: PoolAccount): Promise<PsnTokens> {
  const known = held.get(account.id)
  if (known && usable(known)) return known
  let next = pending.get(account.id)
  if (!next) {
    next = lockPsnTokens(account.id, (secrets) => nextTokens(account, secrets))
      .then((t) => {
        held.set(account.id, t)
        return t
      })
      .finally(() => pending.delete(account.id))
    pending.set(account.id, next)
  }
  return next
}

export async function psnAuthorization(account: PoolAccount): Promise<AuthorizationPayload> {
  return { accessToken: (await psnAccountTokens(account)).accessToken }
}

/** Sony refused the account's access token: drop it here and in the row, so the next call signs in again. */
export async function forgetPsnAccountTokens(id: number): Promise<void> {
  held.delete(id)
  await dropPsnAccessToken(id)
}

/** Drops every token this instance holds (an account renewed or removed from the panel). */
export function forgetPsnTokens(): void {
  held.clear()
}
