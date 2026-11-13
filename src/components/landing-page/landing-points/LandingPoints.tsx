'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { SAMPLE_POINTS } from '@/components/landing-page/landingSamples'
import LandingSectionHead from '@/components/landing-page/landing-section-head/LandingSectionHead'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import VaultPlatformSplit from '@/components/vault-platform-split/VaultPlatformSplit'
import Facts from '@/components/ui/Facts'
import Kicker from '@/components/ui/Kicker'
import { GAME_SOURCES, PLATFORM_NAME } from '@/utils/gameRef'

const TOTAL = Object.values(SAMPLE_POINTS).reduce((sum, n) => sum + (n ?? 0), 0)

/**
 * Vault Points: what they are, the way to the page that explains them, and an example of a player's
 * level, points and where they came from, drawn with the rankings' own badge and split bar.
 */
export default function LandingPoints() {
  const { T, lang } = useLanguage()
  const parts = GAME_SOURCES.filter((s) => SAMPLE_POINTS[s])

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,37.5rem)] lg:gap-14 lg:items-center">
      <LandingSectionHead title={T.landing.pointsTitle} text={T.landing.pointsText} points={T.landing.pointsPoints}>
        <Link href="/rankings/how" className="relative tap-target self-start font-bold underline underline-offset-4 decoration-ink/40 hover:decoration-accent rounded focus-ring">
          {T.rankings.how}
        </Link>
      </LandingSectionHead>
      <div className="flex flex-col gap-3">
        <Kicker>{T.landing.example}</Kicker>
        <div className="flex flex-col gap-4 lg:gap-5 bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-5 lg:p-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <VaultLevelBadge points={TOTAL} size="lg" />
            <span className="font-display italic font-extrabold text-[2.75rem] lg:text-6xl leading-none tabular-nums">
              {TOTAL.toLocaleString(lang)} <span className="text-lg lg:text-[1.375rem] text-text-secondary">{T.rankings.vp}</span>
            </span>
          </div>
          <VaultPlatformSplit split={SAMPLE_POINTS} className="h-3" />
          <p className="text-sm lg:text-[0.9375rem] text-text-secondary">
            <Facts items={parts.map((s) => `${PLATFORM_NAME[s]} ${SAMPLE_POINTS[s]!.toLocaleString(lang)}`)} />
          </p>
        </div>
      </div>
    </section>
  )
}
