/** Sony's code for "this profile hides its trophies". */
export const PRIVATE_CODE = 2240526
/** Sony's code for "Rate limit exceeded" (the 429 body, psn-php #117). */
export const RATE_LIMIT_CODE = 2138635
/** The code a PsnError carries when the app has no PSN sign-in at all. */
export const NOT_CONFIGURED = -1
/** A service account's sign-in was refused: its NPSSO or tokens no longer work (#178). */
export const AUTH_FAILED = -2
/** Sony did not answer before the deadline. */
export const TIMED_OUT = -3
/** PSN_MODE=stale (#180): the app does not call Sony at all for now. */
export const PAUSED = -4

export class PsnError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message)
  }
  get notConfigured() {
    return this.code === NOT_CONFIGURED
  }
  get isPaused() {
    return this.code === PAUSED
  }
  get isPrivate() {
    return this.code === PRIVATE_CODE || /access control|privacy/i.test(this.message)
  }
  /** The account's sign-in was refused (Sony's 401 "invalid token", or a failed token exchange): the account's fault, not the profile's. */
  get isAuth() {
    return this.code === AUTH_FAILED || /invalid token|expired token|token (has )?expired|unauthori[sz]ed|invalid_grant/i.test(this.message)
  }
  /** Sony's "too many requests". psn-api hides the HTTP status, so the code and the message are all there is. */
  get isRateLimited() {
    return this.code === RATE_LIMIT_CODE || /too many requests|rate limit/i.test(this.message)
  }
}

/** The app's own budget for Sony is spent (#177): nothing was asked, ask again in a while. */
export class PsnBusyError extends PsnError {
  constructor() {
    super('too many requests (app budget)')
  }
}

/** What was asked is being built in the background (#177): the route answers 202, the client asks again. */
export class PsnSyncing extends PsnError {
  constructor() {
    super('syncing in the background')
  }
}
