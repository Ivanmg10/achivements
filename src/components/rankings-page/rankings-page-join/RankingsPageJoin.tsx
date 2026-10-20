'use client'

import Link from 'next/link'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** For a visitor without an account: how to get onto the list. */
export default function RankingsPageJoin() {
  const { T } = useLanguage()
  return (
    <section aria-labelledby="rankings-join-title" className="relative bg-bg-card rounded-3xl p-5 flex flex-col gap-3 overflow-hidden">
      <span aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,rgb(var(--accent)/0.18),transparent_65%)]" />
      <h2 id="rankings-join-title" className="relative flex items-center gap-2 text-base font-semibold">
        <IconTrophy size={18} className="text-accent" aria-hidden="true" />
        {T.rankings.joinTitle}
      </h2>
      <p className="relative text-sm text-text-secondary">{T.rankings.joinText}</p>
      <Link
        href="/authPage"
        className="relative self-start px-4 py-2 rounded-full bg-accent text-bg-main text-sm font-semibold hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {T.rankings.joinCta}
      </Link>
    </section>
  )
}
