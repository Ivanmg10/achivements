'use client'

import { slantStyle } from '@/components/ui/shape'
import type { GameSource } from '@/types/steam'

const ORDER: GameSource[] = ['ra', 'steam', 'psn', 'xbox']
const NAMES: Record<GameSource, string> = { ra: 'RA', steam: 'Steam', psn: 'PSN', xbox: 'Xbox' }
/** The same platform colours as the charts that compare platforms (CompletionDistribution). */
export const PLATFORM_FILL: Record<GameSource, string> = { ra: 'bg-accent', steam: 'bg-[#66c0f4]', psn: 'bg-[#0070d1]', xbox: 'bg-success' }

/**
 * How a user's points split across platforms, as one stacked bar. Its
 * accessible name lists each share, so the split never rests on the colours.
 */
export default function VaultPlatformSplit({ split, className = '' }: { split: Partial<Record<GameSource, number>>; className?: string }) {
  const parts = ORDER.map((s) => ({ s, v: split[s] ?? 0 })).filter((p) => p.v > 0)
  const total = parts.reduce((sum, p) => sum + p.v, 0)
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)

  return (
    <span
      role="img"
      aria-label={parts.map((p) => `${NAMES[p.s]} ${pct(p.v)} %`).join(', ') || '0'}
      className={`flex h-2 gap-0.5 ${parts.length === 0 ? 'bg-ink/10' : ''} ${className}`}
    >
      {parts.map((p) => (
        <span
          key={p.s}
          className={`h-full ${PLATFORM_FILL[p.s]}`}
          style={{ width: `${(p.v / total) * 100}%`, ...slantStyle(3) }}
        />
      ))}
    </span>
  )
}

export { NAMES as PLATFORM_NAMES, ORDER as PLATFORM_ORDER }
