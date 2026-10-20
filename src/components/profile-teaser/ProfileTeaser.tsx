'use client'

import Link from 'next/link'
import type { ProfileTeaser as Teaser } from '@/lib/rankings'
import { useLanguage } from '@/context/LanguageContext'
import RankingsPageUser from '@/components/rankings-page/rankings-page-user/RankingsPageUser'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import VaultPlatformSplit from '@/components/vault-platform-split/VaultPlatformSplit'

/**
 * Someone's profile for a visitor without an account (and what a shared link
 * shows): only what the public rankings already do, and a way in to see the rest.
 */
export default function ProfileTeaser({ teaser }: { teaser: Teaser }) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)

  return (
    <section className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="relative bg-bg-card rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-5 text-center overflow-hidden">
        <span aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.18),transparent_65%)]" />
        <h1 className="relative text-xl">
          <RankingsPageUser row={{ username: teaser.username, avatar: teaser.avatar, isMe: false }} size="xl" linked={false} stacked />
        </h1>
        <VaultLevelBadge points={teaser.points} className="relative" />

        <p className="relative text-3xl font-bold tabular-nums">
          {n(teaser.points)} <span className="text-base font-semibold text-text-secondary">{T.rankings.vp}</span>
        </p>
        <VaultPlatformSplit split={teaser.split} className="relative w-full max-w-60" />

        <dl className="relative grid grid-cols-2 gap-3 w-full">
          <div className="bg-ink/5 rounded-2xl p-3">
            <dt className="text-xs text-text-secondary">{T.rankings.colCompleted}</dt>
            <dd className="text-lg font-semibold tabular-nums">{n(teaser.completed)}</dd>
          </div>
          <div className="bg-ink/5 rounded-2xl p-3">
            <dt className="text-xs text-text-secondary">{T.rankings.colAchievements}</dt>
            <dd className="text-lg font-semibold tabular-nums">{n(teaser.achievements)}</dd>
          </div>
        </dl>

        <p className="relative text-sm text-text-secondary">{T.rankings.profileTeaser}</p>
        <div className="relative flex flex-wrap justify-center gap-2">
          <Link
            href="/authPage"
            className="px-4 py-2 rounded-full bg-accent text-bg-main text-sm font-semibold hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {T.rankings.joinCta}
          </Link>
          <Link
            href="/rankings"
            className="px-4 py-2 rounded-full bg-ink/10 text-sm font-semibold hover:bg-ink/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {T.rankings.seeAll}
          </Link>
        </div>
      </div>
    </section>
  )
}
