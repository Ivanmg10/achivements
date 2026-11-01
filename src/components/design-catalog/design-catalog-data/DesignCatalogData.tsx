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
import { steamAssetUrl } from '@/lib/steamAssets'
import DesignCatalogPiece, { Compare, Panel, Specimen } from '../design-catalog-piece/DesignCatalogPiece'

const LEVELS = [1, 10, 20, 30, 45, 60, 75, 90]
const GAME_ART = steamAssetUrl(1927720, 'cover')

function GameRow({ style }: { style: 'tinted' | 'flat' }) {
  return (
    <div className="relative isolate rounded-pane p-3.5 flex items-center gap-3">
      <GameCardBackdrop src={GAME_ART} style={style} />
      <span aria-hidden="true" className="w-12 h-12 rounded-box bg-ink/25 shrink-0" />
      <span className="flex flex-col gap-1.5 flex-1 min-w-0">
        <span className="font-bold">Monument Valley</span>
        <ProgressBar pct={68} label="68 %" />
      </span>
      <strong className="tabular-nums">68%</strong>
    </div>
  )
}

/** Numbers and progress: figures, bars, rings, tiers, surfaces and the game card. */
export default function DesignCatalogData() {
  return (
    <>
      <DesignCatalogPiece id="figures">
        <Panel>
          <div className="flex flex-wrap items-start gap-8">
            <Specimen name="StatPill lg"><StatPill label="Vault Points" value="143.820" sub="this week +48" /></Specimen>
            <Specimen name="StatPill sm"><StatPill size="sm" label="Games" value={273} /></Specimen>
            <Specimen name="StatCard"><StatCard label="Hardcore points" value={8893} accent="text-hardcore" /></Specimen>
            <Specimen name="RarityBadge: 62 · 24 · 6.1 · 0.8 · unknown">{[62, 24, 6.1, 0.8, null].map((p, i) => <RarityBadge key={i} pct={p} />)}</Specimen>
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="progress-bar">
        <Compare>
          <ProgressBar pct={30} label="30 %" />
          <ProgressBar pct={45} softPct={62} label="Hardcore under softcore" />
          <ProgressBar pct={100} label="Finished" />
          <ProgressBar pct={70} label="Taller" height="h-3" />
        </Compare>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="progress-ring">
        <Panel>
          <div className="flex flex-wrap items-center gap-8">
            <CircularProgress earned={33} total={84} label="33 / 84" />
            <CircularProgress earned={19} total={19} label="Finished" />
            <CircularProgress earned={69} total={100} size={128} strokeWidth={10} ariaLabel="69 %" center={<span className="font-display italic font-extrabold text-[2.5rem] leading-none">69%</span>} label="With its own centre" />
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="streak-tag">
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            {STREAK_TIERS.map((t) => <StreakTag key={t.id} days={t.from} text={`${t.from} d`} aria-label={`${t.from} days`} size="lg" />)}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {STREAK_TIERS.map((t) => <StreakTag key={t.id} days={Math.max(t.from, 1)} text={`${Math.max(t.from, 1)} d`} aria-label={`${t.from} days, small`} />)}
          </div>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="level-badge">
        <Panel><div className="flex flex-wrap items-center gap-3">{LEVELS.map((l) => <VaultLevelBadge key={l} points={pointsForLevel(l)} />)}</div></Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="surface">
        <Panel><div className={`${SURFACE} p-4 text-sm`}>SURFACE: the card colour, a hairline ring, rounded-card. Panels in this catalogue sit one step darker, on bg-main.</div></Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="game-card">
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-text-secondary">Colourful</p><GameRow style="tinted" /></Panel>
          <Panel><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-text-secondary">Flat</p><GameRow style="flat" /></Panel>
        </div>
      </DesignCatalogPiece>
    </>
  )
}
