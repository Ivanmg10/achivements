'use client'

import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'

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
      <Button
        href="/authPage"
        className="relative self-start"
      >
        {T.rankings.joinCta}
      </Button>
    </section>
  )
}
