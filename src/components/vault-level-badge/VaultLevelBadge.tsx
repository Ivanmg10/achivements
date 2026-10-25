'use client'

import { useLanguage } from '@/context/LanguageContext'
import { levelOf, tierOf, type TierId } from '@/utils/vaultLevel'

/** Each tier's own hue, for its badge only (progress bars stay in the theme's colour). */
const COLORS: Record<TierId, string> = {
  novice: '148 152 163',
  apprentice: '190 124 78',
  hunter: '45 170 180',
  veteran: '72 130 230',
  expert: '132 96 240',
  master: '218 82 150',
  grandmaster: '232 132 40',
  legend: '214 172 40',
}

/** A shape per tier, so the tier never rests on colour alone. */
const SHAPES: Record<TierId, string> = {
  novice: 'M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  apprentice: 'M6 1.5 10.5 6 6 10.5 1.5 6z',
  hunter: 'M6 1 11 10H1z',
  veteran: 'M2 2h8v8H2z',
  expert: 'M6 1l1.6 3.3 3.6.5-2.6 2.5.6 3.6L6 9.2l-3.2 1.7.6-3.6L.8 4.8l3.6-.5z',
  master: 'M6 1l5 3.5v3L6 11 1 7.5v-3z',
  grandmaster: 'M1 9l1.5-6L5 6l1-4 1 4 2.5-3L11 9z',
  legend: 'M1 8.5l1.5-6L5 5.5l1-4 1 4 2.5-3 1.5 6zM1 9.5h10V11H1z',
}

/**
 * A user's level and tier from their Vault Points, as a pill in the tier's
 * hue with its shape. `compact` shows the level alone (the tier stays in the
 * accessible name and the tooltip).
 */
export default function VaultLevelBadge({
  points,
  compact = false,
  className = '',
}: {
  points: number
  compact?: boolean
  className?: string
}) {
  const { T } = useLanguage()
  const level = levelOf(points)
  const tier = tierOf(level)
  const levelText = T.rankings.levelShort.replace('{n}', String(level))
  const tierText = T.rankings.tiers[tier]

  return (
    <span
      title={`${T.rankings.level.replace('{n}', String(level))} · ${tierText}`}
      // Mixed with the theme's text colour, so the tier's hue stays readable on a light or a dark card.
      style={{ backgroundColor: `rgb(${COLORS[tier]} / 0.15)`, color: `color-mix(in oklab, rgb(${COLORS[tier]}) 72%, rgb(var(--text-main)))` }}
      className={`inline-flex items-center gap-1.5 h-[1.375rem] rounded-tag px-2 text-xs font-bold whitespace-nowrap ${className}`}
    >
      <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" className="w-3 h-3 shrink-0">
        <path d={SHAPES[tier]} />
      </svg>
      <span className="tabular-nums">{levelText}</span>
      {compact ? <span className="sr-only">{tierText}</span> : <span>· {tierText}</span>}
    </span>
  )
}
