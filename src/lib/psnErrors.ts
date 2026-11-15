/** Sony's code for "this profile hides its trophies". */
export const PRIVATE_CODE = 2240526
/** Sony's code for "Rate limit exceeded" (the 429 body, psn-php #117). */
export const RATE_LIMIT_CODE = 2138635
/** The code a PsnError carries when the app has no PSN sign-in at all. */
export const NOT_CONFIGURED = -1

export class PsnError extends Error {
  constructor(message: string, readonly code?: number) {
    super(message)
  }
  get notConfigured() {
    return this.code === NOT_CONFIGURED
  }
  get isPrivate() {
    return this.code === PRIVATE_CODE || /access control|privacy/i.test(this.message)
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
