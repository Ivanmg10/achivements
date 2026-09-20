'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { T } = useLanguage()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6 py-20 text-text-main" role="alert">
      <p className="text-lg font-semibold">{T.errorBoundary.title}</p>
      <p className="text-sm text-text-secondary max-w-md">{T.errorBoundary.subtitle}</p>
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 rounded-lg bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/70"
      >
        {T.gameInfoPage.retry}
      </button>
    </main>
  )
}
