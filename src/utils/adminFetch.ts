/** Fired when an admin call answers that the panel has to be unlocked again. */
export const ADMIN_LOCKED_EVENT = 'admin-locked'

/**
 * fetch for the admin API. When the unlock has run out (403 reauth-required),
 * it tells the panel, which goes back to asking for the password — wherever
 * the call came from: the list, a modal, a toggle.
 */
export async function adminFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init)
  if (res.status === 403) {
    const data = await res.clone().json().catch(() => null)
    if (data?.error === 'reauth-required') window.dispatchEvent(new Event(ADMIN_LOCKED_EVENT))
  }
  return res
}
