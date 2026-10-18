'use client'

import { LanguageProvider } from '@/context/LanguageContext'
import RouteError from '@/components/route-error/RouteError'
import { inter } from '@/lib/fonts'
import './globals.css'

/**
 * Last resort, for an error in the root layout or in a page with no error.tsx
 * above it. It replaces the root layout, so it brings its own <html>, styles
 * and language provider, and shows the same screen as a route's error, full screen.
 */
export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body className="bg-bg-main text-text-main">
        <LanguageProvider>
          <RouteError {...props} fullScreen />
        </LanguageProvider>
      </body>
    </html>
  )
}
