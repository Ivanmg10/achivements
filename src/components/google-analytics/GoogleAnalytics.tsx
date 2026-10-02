'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { GA_ID, pageLocation } from '@/lib/analytics'

type Gtag = (...args: unknown[]) => void

/** GA4, mounted only once the visitor has accepted cookies. */
export default function GoogleAnalytics() {
  const { consent } = useCookieConsent()
  const pathname = usePathname()
  const enabled = Boolean(GA_ID) && consent === 'granted'

  useEffect(() => {
    if (!enabled) return
    const w = window as unknown as { dataLayer: unknown[]; gtag?: Gtag }
    w.dataLayer = w.dataLayer || []
    if (!w.gtag) {
      // gtag.js reads `arguments` objects off the dataLayer, not arrays.
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer.push(arguments)
      }
      w.gtag('js', new Date())
    }
    // One config per route: it sends the page_view, and pins page_location
    // (query-free) for every event that follows.
    w.gtag('config', GA_ID, { page_location: pageLocation() })
  }, [enabled, pathname])

  if (!enabled) return null
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
}
