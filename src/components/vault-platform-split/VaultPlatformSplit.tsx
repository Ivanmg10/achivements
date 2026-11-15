'use client'

import DataBar from '@/components/ui/DataBar'
import { GAME_SOURCES } from '@/utils/gameRef'
import type { GameSource } from '@/types/game'

const NAMES: Record<GameSource, string> = { ra: 'RA', steam: 'Steam', psn: 'PSN', xbox: 'Xbox' }
/** The same platform colours as the charts that compare platforms (CompletionDistribution). */
export const PLATFORM_FILL: Record<GameSource, string> = { ra: 'bg-accent', steam: 'bg-steam', psn: 'bg-psn', xbox: 'bg-success' }
/** The same, as a colour for a bar (`DataBar color`). */
export const PLATFORM_COLOR: Record<GameSource, string> = { ra: 'var(--color-accent)', steam: 'var(--color-steam)', psn: 'var(--color-psn)', xbox: 'var(--color-success)' }

/**
 * How a user's points split across platforms, as one stacked bar. Its
 * accessible name lists each share, so the split never rests on the colours;
 * with `legend`, each platform's name under it, in the bar's order, says so to
 * the eye too (the signed-out profile card, #130).
 */
export default function VaultPlatformSplit({ split, legend = false, className = '' }: { split: Partial<Record<GameSource, number>>; legend?: boolean; className?: string }) {
  const parts = GAME_SOURCES.map((s) => ({ s, v: split[s] ?? 0 })).filter((p) => p.v > 0)
  const total = parts.reduce((sum, p) => sum + p.v, 0)
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)

  const bar = (
    <span
      role="img"
      aria-label={parts.map((p) => `${NAMES[p.s]} ${pct(p.v)} %`).join(', ') || '0'}
      className={`flex h-2 gap-0.5 ${parts.length === 0 ? 'bg-ink/10' : ''} ${legend ? '' : className}`}
    >
      {parts.map((p) => (
        <DataBar key={p.s} share={p.v / total} color={PLATFORM_COLOR[p.s]} className="h-full" />
      ))}
    </span>
  )
  if (!legend) return bar

  return (
    <span className={`flex flex-col gap-1.5 ${className}`}>
      {bar}
      {/* The bar's own name already says it to a screen reader. */}
      {parts.length > 0 && (
        <span aria-hidden="true" className="flex justify-between gap-3 text-xs text-text-secondary">
          {parts.map((p) => (
            <span key={p.s} className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${PLATFORM_FILL[p.s]}`} />
              {NAMES[p.s]}
            </span>
          ))}
        </span>
      )}
    </span>
  )
}

export { NAMES as PLATFORM_NAMES }
