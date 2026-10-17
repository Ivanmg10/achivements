'use client'

import Link from 'next/link'
import { IconArrowRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

const PRIMARY =
  'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-bg-main font-semibold hover:bg-accent-hover active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main'

/** The last thing a visitor reads: it is free, and the way to create an account. */
export default function LandingClosing() {
  const { T } = useLanguage()

  return (
    <div className="relative overflow-hidden bg-bg-card rounded-3xl ring-1 ring-ink/[0.06] px-6 py-12 flex flex-col items-center text-center gap-4">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.12),transparent_60%)]" />
      <h2 className="relative text-2xl sm:text-3xl font-bold tracking-tight">{T.landing.closingTitle}</h2>
      <p className="relative text-sm sm:text-base text-text-secondary max-w-md">{T.landing.closingText}</p>
      <Link href="/authPage?mode=register" className={`relative ${PRIMARY}`}>
        {T.landing.createAccount}
        <IconArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  )
}
