import { formatRarity } from '@/utils/steamFeed'

/** How rare, as a tone: under 5 % in the hardcore gold, under 20 % in the accent, the rest neutral. */
export function rarityTone(pct: number) {
  if (pct < 5) return 'bg-hardcore/15 text-hardcore'
  if (pct < 20) return 'bg-accent/15 text-accent'
  return 'bg-ink/[0.07] text-text-secondary'
}

/**
 * The share of players who have an achievement, as a tinted figure (no bar: the
 * user's choice, 2026-10-24). A dash when it is not known.
 */
export default function RarityBadge({ pct }: { pct: number | null | undefined }) {
  if (pct == null || Number.isNaN(pct)) return <span className="text-sm text-text-secondary">—</span>
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-chip text-xs font-bold tabular-nums ${rarityTone(pct)}`}>
      {formatRarity(pct)}%
    </span>
  )
}
