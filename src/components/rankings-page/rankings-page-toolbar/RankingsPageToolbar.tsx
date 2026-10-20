'use client'

import { IconCheck } from '@tabler/icons-react'
import type { RankingsView } from '@/hooks/useRankings'
import type { RankPeriod, RankScope, RankSource } from '@/lib/rankings'
import { useLanguage } from '@/context/LanguageContext'
import { PLATFORM_FILL, PLATFORM_NAMES } from '@/components/vault-platform-split/VaultPlatformSplit'

const PERIODS: RankPeriod[] = ['all', 'month', 'week']

const chip = (on: boolean) =>
  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
    on ? 'bg-bg-header text-text-main ring-1 ring-text-secondary/30' : 'bg-bg-card text-text-secondary hover:text-text-main'
  }`

/**
 * Who to compare with (tabs: everyone, or you and whom you follow), over what
 * time, and on which platform. The chosen chip says so with a tick, not colour alone.
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
        <div role="tablist" aria-label={T.rankings.scope} className="inline-flex self-start bg-bg-card rounded-xl p-1 gap-0.5">
          {scopes.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={view.scope === s}
              onClick={() => set({ scope: s })}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                view.scope === s ? 'bg-bg-tertiary text-text-main' : 'text-text-secondary hover:text-text-main'
              }`}
            >
              {s === 'global' ? T.rankings.global : T.rankings.following}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <div role="group" aria-label={T.rankings.period} className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button key={p} aria-pressed={view.period === p} onClick={() => set({ period: p })} className={chip(view.period === p)}>
              {view.period === p && <IconCheck size={12} aria-hidden="true" />}
              {T.rankings[p]}
            </button>
          ))}
        </div>
        <span aria-hidden="true" className="hidden sm:block w-px h-5 bg-ink/10 mx-1" />
        <div role="group" aria-label={T.rankings.platform} className="flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <button key={s} aria-pressed={view.source === s} onClick={() => set({ source: s })} className={chip(view.source === s)}>
              {view.source === s ? <IconCheck size={12} aria-hidden="true" /> : s !== 'all' && <span aria-hidden="true" className={`w-2 h-2 rounded-full ${PLATFORM_FILL[s]}`} />}
              {s === 'all' ? T.rankings.allPlatforms : PLATFORM_NAMES[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
