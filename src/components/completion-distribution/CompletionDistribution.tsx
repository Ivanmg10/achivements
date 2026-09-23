import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { completionBuckets } from '@/utils/utils'

/** Ordered bands, least complete first — a magnitude scale, so one hue, light to dark. */
const BAND_LABELS = ['<25%', '25–49%', '50–74%', '75–99%', '100%']

const TONES = {
  ra: ['bg-accent/20', 'bg-accent/35', 'bg-accent/55', 'bg-accent/75', 'bg-accent'],
  steam: ['bg-[#66c0f4]/20', 'bg-[#66c0f4]/35', 'bg-[#66c0f4]/55', 'bg-[#66c0f4]/75', 'bg-[#66c0f4]'],
} as const

/**
 * How a library splits across completion bands, as one stacked bar plus its
 * counts. Both platforms use the same bands and the same shape, so the card
 * reads the same whichever is selected; only the hue says which one it is.
 *
 * Every band is labelled with its range and count, so the bar never carries
 * meaning by colour alone.
 */
export default function CompletionDistribution({
  fractions,
  tone,
  note,
  isLoading,
}: {
  /** Completion per game, 0–1. */
  fractions: number[]
  tone: keyof typeof TONES
  /** Shown under the bar — e.g. that some games' progress has not loaded. */
  note?: string
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const counts = useMemo(() => completionBuckets(fractions), [fractions])
  const total = counts.reduce((sum, c) => sum + c, 0)
  const shades = TONES[tone]

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 animate-pulse" aria-busy="true">
        <div className="h-2 w-32 rounded bg-white/10" />
        <div className="h-2.5 w-full rounded-full bg-white/10" />
        <div className="h-2 w-40 rounded bg-white/10" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.charts.completionDistTitle}</p>

      {total === 0 ? (
        <p className="text-xs text-text-secondary">{T.cards.noData}</p>
      ) : (
        <>
          <div className="flex gap-0.5 h-2.5" role="img" aria-label={counts.map((c, i) => `${BAND_LABELS[i]}: ${c}`).join(', ')}>
            {counts.map((count, i) => (
              count > 0 && (
                <div
                  key={BAND_LABELS[i]}
                  className={`${shades[i]} first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              )
            ))}
          </div>

          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {counts.map((count, i) => (
              <li key={BAND_LABELS[i]} className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                <span className={`w-2 h-2 rounded-sm shrink-0 ${shades[i]}`} aria-hidden="true" />
                {BAND_LABELS[i]}
                <span className="text-text-main tabular-nums">{count}</span>
              </li>
            ))}
          </ul>

          {note && <p className="text-[10px] text-text-secondary/60">{note}</p>}
        </>
      )}
    </div>
  )
}
