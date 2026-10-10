import { useCallback } from 'react'
import { setAnalyticsEnabled } from '@/lib/analytics'
import { useStorageValue } from '@/hooks/useStorageValue'

export type Consent = 'granted' | 'denied'

const STORAGE_KEY = 'cookie-consent'

/**
 * The visitor's cookie choice, shared by every component that asks.
 * `undefined` until read after mount (so the banner never flashes), `null` when
 * nothing has been chosen yet. `choose(null)` withdraws it: analytics stops at
 * once and the banner comes back.
 */
export function useCookieConsent() {
  const [saved, save] = useStorageValue(STORAGE_KEY)
  const consent: Consent | null | undefined =
    saved === undefined ? undefined : saved === 'granted' || saved === 'denied' ? saved : null

  const choose = useCallback((next: Consent | null) => {
    // Not remembered if storage is blocked — the choice still applies until the page is left.
    save(next)
    // Withdrawing (null) stops analytics too: until asked again, nothing is granted.
    setAnalyticsEnabled(next === 'granted')
  }, [save])

  return { consent, choose }
}
