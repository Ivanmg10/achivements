import { useCallback, useEffect, useState } from 'react'
import { setAnalyticsEnabled } from '@/lib/analytics'

export type Consent = 'granted' | 'denied'

const STORAGE_KEY = 'cookie-consent'
const EVENT = 'cookie-consent-change'

function readConsent(): Consent | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'granted' || saved === 'denied' ? saved : null
  } catch {
    return null
  }
}

/**
 * The visitor's cookie choice, shared by every component that asks.
 * `undefined` until read after mount (so the banner never flashes), `null` when
 * nothing has been chosen yet. `choose(null)` withdraws it: analytics stops at
 * once and the banner comes back.
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined)

  useEffect(() => {
    setConsent(readConsent())
    const sync = (e: Event) => setConsent((e as CustomEvent<Consent | null>).detail)
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const choose = useCallback((next: Consent | null) => {
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next)
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Not remembered — the choice still applies until the page is left.
    }
    // Withdrawing (null) stops analytics too: until asked again, nothing is granted.
    setAnalyticsEnabled(next === 'granted')
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
  }, [])

  return { consent, choose }
}
