/**
 * A brake on account creation, per client address.
 *
 * Registration is open, so the endpoint writes a row for anyone who asks.
 * This keeps one address from filling the table in a loop. It lives in the
 * process, so each server instance counts on its own — enough for a hobby
 * deployment, not a defence against a distributed flood.
 *
 * ponytail: in-memory per instance; move to the database or a shared cache if
 * the app ever runs on more than one instance and this starts mattering.
 */
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 5

const attempts = new Map<string, number[]>()

/** The address Vercel and most proxies put the real client in. */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

/** Records an attempt. False when this address has had too many lately. */
export function allowSignup(address: string, now = Date.now()): boolean {
  const recent = (attempts.get(address) ?? []).filter((at) => now - at < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    attempts.set(address, recent)
    return false
  }
  recent.push(now)
  attempts.set(address, recent)

  // Keep the map from growing forever on a long-running instance.
  if (attempts.size > 5000) {
    for (const [key, times] of attempts) {
      if (times.every((at) => now - at >= WINDOW_MS)) attempts.delete(key)
    }
  }
  return true
}

/** Test seam: forgets every address. */
export function resetSignupLimit() {
  attempts.clear()
}
