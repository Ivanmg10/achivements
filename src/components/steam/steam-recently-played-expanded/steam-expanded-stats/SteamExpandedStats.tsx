'use client'

import { useLanguage } from '@/context/LanguageContext'
import { formatPlaytime } from '@/utils/steamFeed'

/**
 * The stat list beside the progress ring in an expanded Steam game — RA's
 * GameExpandedMobileStats with Steam's numbers: playtime in place of points.
 * Like RA's, it shows on small screens only; on desktop the ring stands alone.
 */
export default function SteamExpandedStats({
  playtimeForever,
  playtime2Weeks,
  completionPct,
  remaining,
}: {
  playtimeForever: number
  playtime2Weeks: number
  completionPct: number
  remaining: number
}) {
  const { T, lang } = useLanguage()
  const units = { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }

  const rows = [
    { label: T.steam.playtime, value: formatPlaytime(playtimeForever, units, lang), className: 'text-[#66c0f4]' },
    { label: T.steam.last2Weeks, value: formatPlaytime(playtime2Weeks, units, lang), className: 'text-text-main' },
    { label: T.gameExpanded.completion, value: `${completionPct}%`, className: 'text-success' },
    { label: T.gameExpanded.remaining, value: String(remaining), className: 'text-info' },
  ]

  return (
    <dl className="flex flex-col gap-2.5 flex-1 min-w-0 lg:hidden">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-2">
          <dt className="text-[11px] uppercase tracking-wide text-text-secondary">{r.label}</dt>
          <dd className={`text-base font-bold ${r.className}`}>{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}
