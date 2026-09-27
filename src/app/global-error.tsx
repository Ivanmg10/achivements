'use client'

import { useEffect } from 'react'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import './globals.css'

/**
 * Last resort, for an error in the root layout or in a page with no error.tsx
 * above it (the sign-in pages). It replaces the root layout, so it brings its
 * own <html>, styles and language provider.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" data-theme="dark">
      <body className="bg-bg-main text-text-main">
        <LanguageProvider>
          <GlobalErrorContent reset={reset} />
        </LanguageProvider>
      </body>
    </html>
  )
}

function GlobalErrorContent({ reset }: { reset: () => void }) {
  const { T } = useLanguage()

  return (
    <main role="alert" className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6 py-20">
      <h1 className="text-lg font-semibold">{T.errorBoundary.title}</h1>
      <p className="text-sm text-text-secondary max-w-md">{T.errorBoundary.subtitle}</p>
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 rounded-lg bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {T.gameInfoPage.retry}
      </button>
    </main>
  )
}
