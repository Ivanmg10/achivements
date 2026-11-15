'use client'

import type { ProfileTeaser as Teaser } from '@/lib/rankings'
import { useLanguage } from '@/context/LanguageContext'
import RankingsPageUser from '@/components/rankings-page/rankings-page-user/RankingsPageUser'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import { CountUp } from '@/components/ui/CountUp'
import VaultPlatformSplit from '@/components/vault-platform-split/VaultPlatformSplit'
import Button from '@/components/ui/Button'
import { REGISTER_HREF } from '@/utils/authLinks'

/**
 * Someone's profile for a visitor without an account (and what a shared link
 * shows): only what the public rankings already do, and a way in to see the rest.
 */
export default function ProfileTeaser({ teaser }: { teaser: Teaser }) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)

  return (
    <section className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="enter-card relative bg-bg-card rounded-card p-6 sm:p-8 flex flex-col items-center gap-5 text-center overflow-hidden">
        <span aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.18),transparent_65%)]" />
        <h1 className="relative text-xl">
          <RankingsPageUser row={{ username: teaser.username, avatar: teaser.avatar, isMe: false }} size="xl" linked={false} stacked />
        </h1>
        <VaultLevelBadge points={teaser.points} className="relative" />

        <p className="relative font-display italic font-extrabold text-4xl leading-none tabular-nums pr-1">
          <CountUp value={teaser.points} locale={lang} /> <span className="text-base font-semibold text-text-secondary">{T.rankings.vp}</span>
        </p>
        <VaultPlatformSplit split={teaser.split} legend className="relative w-full max-w-60" />

        <dl className="relative grid grid-cols-2 gap-3 w-full">
          <div className="bg-ink/5 rounded-tile p-3">
            <dt className="text-xs text-text-secondary">{T.rankings.colCompleted}</dt>
            <dd className="text-lg font-semibold tabular-nums">{n(teaser.completed)}</dd>
          </div>
          <div className="bg-ink/5 rounded-tile p-3">
            <dt className="text-xs text-text-secondary">{T.rankings.colAchievements}</dt>
            <dd className="text-lg font-semibold tabular-nums">{n(teaser.achievements)}</dd>
          </div>
        </dl>

        <p className="relative text-sm text-text-secondary">{T.rankings.profileTeaser}</p>
        <div className="relative flex flex-wrap justify-center gap-2">
          <Button href={REGISTER_HREF}>{T.rankings.joinCta}</Button>
          <Button href="/rankings" variant="secondary">{T.rankings.seeAll}</Button>
        </div>
      </div>
    </section>
  )
}
