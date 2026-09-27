'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

/** Any URL that matches nothing, and any page that calls notFound(). Answers with a real 404. */
export default function NotFound() {
  const { T } = useLanguage()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6 py-20 bg-bg-main text-text-main">
      <h1 className="text-2xl font-semibold">{T.notFound.title}</h1>
      <p className="text-sm text-text-secondary max-w-md">{T.notFound.subtitle}</p>
      <Link
        href="/"
        className="mt-2 px-4 py-2 rounded-lg bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {T.notFound.home}
      </Link>
    </main>
  )
}
