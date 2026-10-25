'use client'

import type { RankingsView } from '@/hooks/useRankings'
import type { RankPeriod, RankScope, RankSort, RankSource } from '@/lib/rankings'
import { useLanguage } from '@/context/LanguageContext'
import { PLATFORM_FILL, PLATFORM_NAMES } from '@/components/vault-platform-split/VaultPlatformSplit'
import { pillClass } from '@/components/ui/Pill'
import Tabs from '@/components/ui/Tabs'
import Select from '@/components/ui/Select'

const PERIODS: RankPeriod[] = ['all', 'month', 'week']
const SORTS: RankSort[] = ['points', 'streak', 'best']
const SORT_LABEL = { points: 'sortPoints', streak: 'sortStreak', best: 'sortBest' } as const

/**
 * Who to compare with (tabs: everyone, or you and whom you follow), over what
 * time, on which platform, and ordered by points or by a streak. The chosen chip is ringed, not only coloured.
 */
export default function RankingsPageToolbar({
  view,
  onChange,
  signedIn,
  xbox,
}: {
  view: RankingsView
  onChange: (view: RankingsView) => void
  signedIn: boolean
  /** Xbox is admin-only for now. */
  xbox: boolean
}) {
  const { T } = useLanguage()
  const scopes: RankScope[] = signedIn ? ['global', 'following'] : ['global']
  const sources: RankSource[] = ['all', 'ra', 'steam', 'psn', ...(xbox ? (['xbox'] as const) : [])]
  const set = (change: Partial<RankingsView>) => onChange({ ...view, ...change })

  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-3.5 lg:shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]">
      {scopes.length > 1 && (
        <Tabs
          id="rankings-scope"
          aria-label={T.rankings.scope}
          className="lg:shadow-none"
          value={view.scope}
          onChange={(scope) => set({ scope })}
          tabs={scopes.map((s) => ({ value: s, label: s === 'global' ? T.rankings.global : T.rankings.following }))}
        />
      )}

      <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:mb-1.5">
        <div role="group" aria-label={T.rankings.platform} className="flex flex-wrap gap-1 pr-2.5 mr-0.5 shadow-[inset_-1px_0_0_rgb(var(--ink)/0.1)]">
          {sources.map((s) => (
            <button key={s} type="button" aria-pressed={view.source === s} onClick={() => set({ source: s })} className={pillClass(view.source === s)}>
              {s !== 'all' && <span aria-hidden="true" className={`w-3 h-3 rounded-[3px] ${PLATFORM_FILL[s]}`} />}
              {s === 'all' ? T.rankings.allPlatforms : PLATFORM_NAMES[s]}
            </button>
          ))}
        </div>
        <Select<RankPeriod>
          aria-label={T.rankings.period}
          prefix={T.rankings.period}
          size="sm"
          value={view.period}
          onChange={(period) => set({ period })}
          options={PERIODS.map((p) => ({ value: p, label: T.rankings[p] }))}
        />
        <Select<RankSort>
          aria-label={T.rankings.sort}
          prefix={T.rankings.sort}
          size="sm"
          value={view.sort ?? 'points'}
          onChange={(sort) => set({ sort })}
          options={SORTS.map((s) => ({ value: s, label: T.rankings[SORT_LABEL[s]] }))}
        />
      </div>
    </div>
  )
}
