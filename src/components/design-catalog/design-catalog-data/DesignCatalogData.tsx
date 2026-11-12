'use client'

import { IconDeviceGamepad2 } from '@tabler/icons-react'
import Figure from '@/components/ui/Figure'
import RarityBadge from '@/components/ui/RarityBadge'
import Tag, { type TagTone } from '@/components/ui/Tag'
import Facts from '@/components/ui/Facts'
import DateText from '@/components/ui/DateText'
import Avatar from '@/components/ui/Avatar'
import ListRow from '@/components/ui/ListRow'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CircularProgress } from '@/components/ui/CircularProgress'
import DataBar from '@/components/ui/DataBar'
import StreakTag from '@/components/ui/StreakTag'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { SURFACE } from '@/components/ui/surface'
import { STREAK_TIERS } from '@/utils/streakTier'
import { pointsForLevel } from '@/utils/vaultLevel'
import { steamAssetUrl } from '@/lib/steamAssets'
import DesignCatalogPiece, { Compare, Panel, Specimen } from '../design-catalog-piece/DesignCatalogPiece'
import Kicker from '@/components/ui/Kicker'

const TAG_TONES: TagTone[] = ['muted', 'neutral', 'accent', 'info', 'success', 'warning', 'danger', 'hardcore']
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
            <Specimen name="bare"><Figure label="Vault Points" value="143.820" sub="this week +48" /></Specimen>
            <Specimen name="tile"><Figure look="tile" label="Games" value={273} /></Specimen>
            <Specimen name="card · tone hardcore"><Figure look="card" label="Hardcore points" value={8893} tone="hardcore" /></Specimen>
            <Specimen name="card compact · tone platinum"><Figure look="card" compact label="Platinum" value={12} tone="platinum" /></Specimen>
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

      <DesignCatalogPiece id="data-bar">
        <Compare>
          <Specimen name="x · track · cut 4">
            <span className="flex flex-col gap-2 w-48">{[0.9, 0.55, 0.2].map((s) => <DataBar key={s} track share={s} className="h-2" />)}</span>
          </Specimen>
          <Specimen name="y · cut 8 · soft and accent">
            <span className="flex items-end gap-2 h-24 w-48">
              {[0.3, 0.6, 1, 0.45, 0.15].map((s, i) => <span key={i} className="flex-1 h-full flex items-end"><DataBar axis="y" min={4} share={s} tone={s === 1 ? 'accent' : 'soft'} className="w-full" /></span>)}
            </span>
          </Specimen>
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

      <DesignCatalogPiece id="tag">
        <Compare>
          <Specimen name="tone · md">{TAG_TONES.map((t) => <Tag key={t} tone={t}>{t}</Tag>)}</Specimen>
          <Specimen name="size sm · md · lg">
            <Tag size="sm" tone="info">Progression</Tag>
            <Tag tone="accent">Beta</Tag>
            <Tag size="lg" tone="neutral">PS5</Tag>
          </Specimen>
          <Specimen name="lg, upright (the game page's chips)">
            <Tag size="lg" tone="neutral">Nintendo 64</Tag>
            <Tag size="lg" tone="danger">2 missable</Tag>
          </Specimen>
          <Specimen name="slant: only the player's own marks, the level and the streak">
            <VaultLevelBadge points={pointsForLevel(31)} compact size="lg" />
            <StreakTag days={56} text="56 d" glow={false} />
            <StreakTag days={0} text="00 d" glow={false} loading />
          </Specimen>
          <Specimen name="overlay, on a picture">
            <span className="rounded-tile p-3 bg-accent/40"><Tag tone="overlay">Steam</Tag></span>
          </Specimen>
        </Compare>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="facts">
        <Compare>
          <Specimen name="a game's line">
            <span className="flex flex-wrap items-center text-[0.8125rem] text-text-secondary">
              <Facts items={['15/49 achievements', '102/485 pts', '2 Nov 2026']} />
            </span>
          </Specimen>
        </Compare>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="date">
        <Panel>
          <Specimen name="a platform's date, in the reader's language">
            <span className="text-sm text-text-secondary">
              <DateText value="2026-10-22 18:30:00" />
            </span>
          </Specimen>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="avatar">
        <Panel>
          <Specimen name="initial · 32 · 40 · 56 · 72, online">
            {[32, 40, 56, 72].map((s) => <Avatar key={s} name="Palmera" size={s} online />)}
          </Specimen>
          <Specimen name="icon fallback · a ring">
            <Avatar name="Palmera" size={60} fallback="icon" />
            <Avatar name="Palmera" size={60} ring="ring-2 ring-hardcore" />
          </Specimen>
        </Panel>
      </DesignCatalogPiece>

      <DesignCatalogPiece id="list-row">
        <Compare>
          <ListRow media={<IconDeviceGamepad2 size={20} aria-hidden="true" />} title="Celeste" sub="Steam · 42 %" trailing={<Tag size="sm">PC</Tag>} />
          <ListRow media={<Avatar name="Palmera" size={40} />} title="Palmera" sub="Level 57" />
        </Compare>
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
          <Panel><Kicker size="sm">Colourful</Kicker><GameRow style="tinted" /></Panel>
          <Panel><Kicker size="sm">Flat</Kicker><GameRow style="flat" /></Panel>
        </div>
      </DesignCatalogPiece>
    </>
  )
}
