'use client'

import { IconCheck } from '@tabler/icons-react'
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

const chip = (on: boolean) => pillClass(on)

/**
 * Who to compare with (tabs: everyone, or you and whom you follow), over what
 * time, on which platform, and ordered by points or by a streak. The chosen chip says so with a tick, not colour alone.
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {scopes.length > 1 && (
        <Tabs
          id="rankings-scope"
          aria-label={T.rankings.scope}
          size="sm"
          className="self-start"
          value={view.scope}
          onChange={(scope) => set({ scope })}
          tabs={scopes.map((s) => ({ value: s, label: s === 'global' ? T.rankings.global : T.rankings.following }))}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Select<RankPeriod>
          aria-label={T.rankings.period}
          size="sm"
          className="w-40"
          value={view.period}
          onChange={(period) => set({ period })}
          options={PERIODS.map((p) => ({ value: p, label: T.rankings[p] }))}
        />
        <span aria-hidden="true" className="hidden sm:block w-px h-5 bg-ink/10 mx-1" />
        <div role="group" aria-label={T.rankings.platform} className="flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <button key={s} aria-pressed={view.source === s} onClick={() => set({ source: s })} className={chip(view.source === s)}>
              {view.source === s ? <IconCheck size={12} aria-hidden="true" /> : s !== 'all' && <span aria-hidden="true" className={`w-2 h-2 rounded-full ${PLATFORM_FILL[s]}`} />}
              {s === 'all' ? T.rankings.allPlatforms : PLATFORM_NAMES[s]}
            </button>
          ))}
        </div>
        <span aria-hidden="true" className="hidden sm:block w-px h-5 bg-ink/10 mx-1" />
        <Select<RankSort>
          aria-label={T.rankings.sort}
          size="sm"
          className="w-48"
          value={view.sort ?? 'points'}
          onChange={(sort) => set({ sort })}
          options={SORTS.map((s) => ({ value: s, label: T.rankings[SORT_LABEL[s]] }))}
        />
      </div>
    </div>
  )
}
