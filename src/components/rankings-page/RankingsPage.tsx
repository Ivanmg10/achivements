'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { IconInfoCircle, IconTrophy, IconUsers } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRankings, type RankingsView } from '@/hooks/useRankings'
import { useVaultMe } from '@/hooks/useVaultMe'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import EmptyState from '@/components/empty-state/EmptyState'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import RankingsPageToolbar from './rankings-page-toolbar/RankingsPageToolbar'
import RankingsPagePodium from './rankings-page-podium/RankingsPagePodium'
import RankingsPageTable from './rankings-page-table/RankingsPageTable'
import RankingsPageList from './rankings-page-list/RankingsPageList'
import RankingsPageMeBar from './rankings-page-me-bar/RankingsPageMeBar'
import RankingsPageLevelPanel from './rankings-page-level-panel/RankingsPageLevelPanel'
import RankingsPageNear from './rankings-page-near/RankingsPageNear'
import RankingsPageJoin from './rankings-page-join/RankingsPageJoin'
import RankingsPageSkeleton from './rankings-page-skeleton/RankingsPageSkeleton'

// Downloaded the first time it is opened, not with the page.
const RankingsPageHow = dynamic(() => import('./rankings-page-how/RankingsPageHow'), { loading: () => null })

/** Following someone's few people reads better as one plain list than as a podium. */
const PODIUM_FROM = 15

/**
 * The rankings in Vault Points (a beta): everyone, or you and whom you follow;
 * all time, this month or this week; every platform or one. A podium, then the
 * table (a list on phones), fifty at a time; your level and close rivals
 * beside it; and where you stand, pinned to the bottom. Signed out, only
 * everyone, and how to join.
 */
export default function RankingsPage({ signedIn }: { signedIn: boolean }) {
  const { T } = useLanguage()
  const xbox = useXboxEnabled()
  const [view, setView] = useState<RankingsView>({ scope: 'global', period: 'all', source: 'all' })
  const [howOpen, setHowOpen] = useState(false)
  const { data, rows, isLoading, error, retry, more, hasMore, loadingMore, moreFailed } = useRankings(view)
  const { me: vault } = useVaultMe()

  const total = data?.total ?? 0
  const podium = view.scope === 'global' || total >= PODIUM_FROM ? rows.slice(0, 3) : []
  const rest = rows.slice(podium.length)
  const me = data?.me ?? null
  const meShown = me !== null && rows.some((r) => r.isMe)
  const above = me ? ([...rows, ...(data?.near ?? [])].find((r) => r.rank === me.rank - 1) ?? null) : null
  const caption = `${view.scope === 'global' ? T.rankings.global : T.rankings.following} · ${T.rankings[view.period]}`

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight">
              <IconTrophy size={26} className="text-accent" aria-hidden="true" />
              {T.rankings.title}
              <span className="text-[10px] uppercase tracking-wider font-bold bg-accent/15 text-accent px-2 py-0.5 rounded-full">{T.rankings.beta}</span>
            </h1>
            <p className="text-sm text-text-secondary">{T.rankings.intro}</p>
          </div>
          <button
            onClick={() => setHowOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-bg-card text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconInfoCircle size={14} aria-hidden="true" />
            {T.rankings.how}
          </button>
        </header>

        <RankingsPageToolbar view={view} onChange={setView} signedIn={signedIn} xbox={xbox} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          <div className="flex flex-col gap-4 min-w-0">
            {isLoading ? (
              <RankingsPageSkeleton podium={view.scope === 'global'} />
            ) : error ? (
              <div className="bg-bg-card rounded-2xl flex flex-col items-center gap-2 py-10 text-center">
                <p role="alert" className="text-sm text-danger">{T.rankings.loadError}</p>
                <button onClick={retry} className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
                  {T.rankings.retry}
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div className="bg-bg-card rounded-2xl">
                <EmptyState
                  icon={view.scope === 'following' ? <IconUsers className="w-6 h-6" /> : <IconTrophy className="w-6 h-6" />}
                  title={T.rankings.empty}
                  subtitle={view.scope === 'following' ? T.rankings.emptyFollowing : undefined}
                  className="py-12"
                />
              </div>
            ) : (
              <>
                {podium.length > 0 && <RankingsPagePodium rows={podium} linked={signedIn} />}
                {rest.length > 0 && (
                  <>
                    <div className="hidden md:block">
                      <RankingsPageTable rows={rest} arrows={data?.arrows ?? false} linked={signedIn} caption={caption} />
                    </div>
                    <div className="md:hidden">
                      <RankingsPageList rows={rest} arrows={data?.arrows ?? false} linked={signedIn} />
                    </div>
                  </>
                )}
                {hasMore && (
                  <button
                    onClick={more}
                    disabled={loadingMore}
                    className="self-center px-4 py-2 rounded-full text-sm font-medium bg-bg-card text-text-secondary hover:text-text-main disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {T.rankings.more}
                  </button>
                )}
                {moreFailed && <p role="alert" className="text-center text-xs text-danger">{T.rankings.loadError}</p>}
              </>
            )}

            {me && !meShown && !isLoading && <RankingsPageMeBar me={me} above={above} showInRankings={vault?.showInRankings !== false} />}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            {signedIn ? (
              <>
                {vault && <RankingsPageLevelPanel me={vault} />}
                {view.scope === 'global' && me && me.listed && (data?.near.length ?? 0) > 0 && <RankingsPageNear me={me} near={data?.near ?? []} />}
              </>
            ) : (
              <RankingsPageJoin />
            )}
          </aside>
        </div>
      </div>

      <LazyWhenOpened open={howOpen}>
        <RankingsPageHow isOpen={howOpen} onClose={() => setHowOpen(false)} />
      </LazyWhenOpened>
    </div>
  )
}
