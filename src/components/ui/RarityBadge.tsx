import { useLanguage } from '@/context/LanguageContext'

/** How rare, as a tone: under 5 % in the hardcore gold, under 20 % in the accent, the rest neutral. */
export function rarityTone(pct: number) {
  if (pct < 5) return 'bg-hardcore/[0.14] text-hardcore'
  if (pct < 20) return 'bg-accent/[0.14] text-accent'
  return 'bg-ink/[0.07] text-text-secondary'
}

/**
 * The share of players who have an achievement, as a tinted figure (no bar: the
 * user's choice, 2026-10-24). A dash when it is not known.
 */
export default function RarityBadge({ pct }: { pct: number | null | undefined }) {
  const { lang } = useLanguage()
  if (pct == null || Number.isNaN(pct)) return <span className="text-sm text-text-secondary">—</span>
  const digits = pct < 1 ? 2 : 1
  return (
    <span className={`inline-flex items-center h-6 px-[0.5625rem] rounded-[0.375rem] text-[0.8125rem] font-bold tabular-nums whitespace-nowrap ${rarityTone(pct)}`}>
      {pct.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits })} %
    </span>
  )
}
