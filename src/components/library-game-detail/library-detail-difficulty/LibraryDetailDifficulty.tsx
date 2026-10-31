'use client'

import { useLanguage } from '@/context/LanguageContext'
import { RARITY_BANDS, rarityBands, type InsightAchievement } from '@/utils/gameInsights'
import { Skeleton } from '@/components/ui/Skeleton'

const BAND_LABEL = { common: 'bandCommon', uncommon: 'bandUncommon', rare: 'bandRare', ultra: 'bandUltra' } as const

/** The share each band covers, in words a reader can check: "25%+", "10–25%", "3–10%", "under 3%". */
const range = (i: number) => {
  const floor = RARITY_BANDS[i].floor
  const above = RARITY_BANDS[i - 1]?.floor
  return above === undefined ? `${floor}%+` : floor === 0 ? `<${above}%` : `${floor}–${above}%`
}

/**
 * How hard a game is: its achievements split by how many players own them,
 * and how many of each the account has. The counts carry the meaning; the
 * bars only show it at a glance.
 */
export default function LibraryDetailDifficulty({ items, isLoading = false }: { items: InsightAchievement[]; isLoading?: boolean }) {
  const { T } = useLanguage()
  const bands = rarityBands(items)
  const widest = Math.max(1, ...bands.map((b) => b.total))
  const known = bands.some((b) => b.total > 0)

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{T.libraryDetail.difficulty}</p>
      {isLoading ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          {RARITY_BANDS.map((b) => (
            <div key={b.id} className="flex flex-col gap-1">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-2" />
            </div>
          ))}
        </div>
      ) : !known ? (
        <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary px-4 py-6">{T.libraryDetail.noRarity}</p>
      ) : (
        <ul className="flex flex-col gap-3 justify-center flex-1 px-1">
          {bands.map((b, i) => (
            <li key={b.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-text-main font-medium">
                  {T.libraryDetail[BAND_LABEL[b.id]]} <span className="text-text-secondary font-normal">({range(i)})</span>
                </span>
                <span className="tabular-nums text-text-secondary">
                  {b.earned} / {b.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-ink/10 overflow-hidden" style={{ width: `${(b.total / widest) * 100}%` }}>
                <div className="h-full rounded-full bg-progress" style={{ width: `${b.total ? (b.earned / b.total) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
