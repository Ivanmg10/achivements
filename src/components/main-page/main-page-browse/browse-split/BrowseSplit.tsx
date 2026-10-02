'use client'

import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'

export type PlatformTotals = { started: number; unlocked: number; perfect: number }

/**
 * The two platforms side by side on the same three counts. The bars share a
 * scale per row, so they compare; each carries its number, and the platforms
 * are named by logo and in the legend, never by colour alone.
 */
export default function BrowseSplit({ ra, steam }: { ra: PlatformTotals; steam: PlatformTotals }) {
  const { T } = useLanguage()
  const rows: { label: string; key: keyof PlatformTotals }[] = [
    { label: T.cards.splitGames, key: 'started' },
    { label: T.cards.splitUnlocked, key: 'unlocked' },
    { label: T.cards.splitPerfect, key: 'perfect' },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.splitTitle}</p>
        <span className="flex items-center gap-3 text-[11px] text-text-secondary">
          <span className="flex items-center gap-1.5"><RaLogo height={10} /> RA</span>
          <span className="flex items-center gap-1.5"><SteamLogo size={12} className="text-[#66c0f4]" aria-hidden="true" /> Steam</span>
        </span>
      </div>
      <dl className="flex flex-col gap-3">
        {rows.map(({ label, key }) => {
          const max = Math.max(ra[key], steam[key], 1)
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <dt className="text-xs text-text-secondary">{label}</dt>
              <dd className="flex flex-col gap-1">
                {[
                  { name: 'RetroAchievements', value: ra[key], bar: 'bg-[#D97706]' },
                  { name: 'Steam', value: steam[key], bar: 'bg-[#66c0f4]' },
                ].map((p) => (
                  <span key={p.name} className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <span className="h-2 rounded-full bg-white/[0.05] overflow-hidden" aria-hidden="true">
                      <span className={`block h-full rounded-full ${p.bar}`} style={{ width: `${(p.value / max) * 100}%` }} />
                    </span>
                    <span className="text-xs tabular-nums font-semibold w-14 text-right">
                      <span className="sr-only">{p.name}: </span>
                      {p.value.toLocaleString()}
                    </span>
                  </span>
                ))}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
