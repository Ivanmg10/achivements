'use client'

import { StatPill, StatCard } from '@/components/ui/StatPill'
import RarityBadge from '@/components/ui/RarityBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CircularProgress } from '@/components/ui/CircularProgress'
import StreakTag from '@/components/ui/StreakTag'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { SURFACE } from '@/components/ui/surface'
import { STREAK_TIERS } from '@/utils/streakTier'
import { pointsForLevel } from '@/utils/vaultLevel'
import DesignCatalogSection, { Specimen } from '../design-catalog-section/DesignCatalogSection'

const LEVELS = [1, 10, 20, 30, 45, 60, 75, 90]

/** Numbers and progress: figures, bars, rings, tiers and the game card. */
export default function DesignCatalogData() {
  return (
    <>
      <DesignCatalogSection id="figures" title="Figures" hint="StatPill (lg / sm), StatCard, RarityBadge (a tinted figure, never a bar).">
        <div className="flex flex-wrap items-start gap-6">
          <Specimen name="StatPill lg"><StatPill label="Vault Points" value="143.820" sub="this week +48" /></Specimen>
          <Specimen name="StatPill sm"><StatPill size="sm" label="Games" value={273} /></Specimen>
          <Specimen name="StatCard"><StatCard label="Hardcore points" value={8893} accent="text-hardcore" /></Specimen>
          <Specimen name="RarityBadge">
            {[62, 24, 6.1, 0.8, null].map((p, i) => <RarityBadge key={i} pct={p} />)}
          </Specimen>
        </div>
      </DesignCatalogSection>

      <DesignCatalogSection id="progress" title="Progress" hint="ProgressBar (bevelled, glows only when finished; RA softcore behind hardcore) and CircularProgress. In the theme's colour; green only in the figure beside it.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <ProgressBar pct={30} label="30 %" />
            <ProgressBar pct={45} softPct={62} label="Hardcore under softcore" />
            <ProgressBar pct={100} label="Finished" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <CircularProgress earned={33} total={84} label="33 / 84" />
            <CircularProgress earned={19} total={19} label="Finished" />
          </div>
        </div>
      </DesignCatalogSection>

      <DesignCatalogSection id="tiers" title="Tiers" hint="StreakTag at 0, 5, 10, 20, 30, 40 and 50 days (streakTier), and VaultLevelBadge by level (each tier has its own hue and shape).">
        <div className="flex flex-wrap items-center gap-3">
          {STREAK_TIERS.map((t) => (
            <StreakTag key={t.id} days={t.from} text={`${t.from} d`} aria-label={`${t.from} days`} size="lg" />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {LEVELS.map((l) => <VaultLevelBadge key={l} points={pointsForLevel(l)} />)}
        </div>
      </DesignCatalogSection>

      <DesignCatalogSection id="surfaces" title="Surfaces" hint="SURFACE (a card), and GameCardBackdrop, which follows the person's choice of colourful or flat game cards.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={`${SURFACE} p-4 text-sm`}>SURFACE: bg-card, hairline ring, rounded-card.</div>
          <div className="relative isolate rounded-[0.875rem] p-4 text-sm min-h-16">
            <GameCardBackdrop src={null} />
            GameCardBackdrop (neutral tint here; a game gives it its colour).
          </div>
        </div>
      </DesignCatalogSection>
    </>
  )
}
