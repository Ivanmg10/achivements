'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconTrophy, IconUsers } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRankings, ZONE_MAX, type RankingsView } from '@/hooks/useRankings'
import { useVaultMe } from '@/hooks/useVaultMe'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { useVaultFillState } from '@/context/VaultFillContext'
import EmptyState from '@/components/empty-state/EmptyState'
import RankingsPageToolbar from './rankings-page-toolbar/RankingsPageToolbar'
import RankingsPagePodium from './rankings-page-podium/RankingsPagePodium'
import RankingsPageTable from './rankings-page-table/RankingsPageTable'
import RankingsPageList from './rankings-page-list/RankingsPageList'
import RankingsPageMeBar from './rankings-page-me-bar/RankingsPageMeBar'
import RankingsPageLevelPanel from './rankings-page-level-panel/RankingsPageLevelPanel'
import RankingsPageZone from './rankings-page-zone/RankingsPageZone'
import RankingsPageHot from './rankings-page-hot/RankingsPageHot'
import RankingsPageJoin from './rankings-page-join/RankingsPageJoin'
import RankingsPageSkeleton from './rankings-page-skeleton/RankingsPageSkeleton'

/** Following someone's few people reads better as one plain list than as a podium. */
const PODIUM_FROM = 15

/**
 * The rankings in Vault Points (a beta): everyone, or you and whom you follow;
 * all time, this month or this week; every platform or one. A podium, then the
 * table (a list on phones), twenty at a time; below it, when you are not
 * there, your zone (who is just above and below you, widened on demand); your
 * level beside it, and who is most active this week. Not listed, a bar pinned to the bottom says where you would
 * be and why you are not shown. Signed out, only everyone, and how to join.
 */
export default function RankingsPage({ signedIn }: { signedIn: boolean }) {
  const { T } = useLanguage()
  const xbox = useXboxEnabled()
  const [view, setView] = useState<RankingsView>({ scope: 'global', period: 'all', source: 'all', sort: 'points' })
  const { data, rows, isLoading, error, retry, more, hasMore, loadingMore, moreFailed, widen, widening, zoneSize } = useRankings(view)
  const { me: vault } = useVaultMe()
  // While your points are being calculated, yours carry "≈" wherever they show.
  const approx = useVaultFillState()?.active === true

  const total = data?.total ?? 0
  const podium = view.scope === 'global' || total >= PODIUM_FROM ? rows.slice(0, 3) : []
  const rest = rows.slice(podium.length)
  const me = data?.me ?? null
  const meShown = me !== null && rows.some((r) => r.isMe)
  // Your zone, from where the list above it ends (it may have grown into it with "show more").
  const zoneStart = data?.zoneStart ?? 0
  const zoneAll = me?.listed && !meShown ? (data?.zone ?? []) : []
  const zone = zoneAll.filter((_, k) => zoneStart + k >= rows.length)
  const upLeft = zoneSize.above < ZONE_MAX ? zoneStart + (zoneAll.length - zone.length) - rows.length : 0
  const downLeft = zoneSize.below < ZONE_MAX ? total - zoneStart - zoneAll.length : 0
  const above = me ? ([...rows, ...zone].find((r) => r.rank === me.rank - 1) ?? null) : null
  const weekView = view.scope === 'global' && view.period === 'week' && view.source === 'all' && view.sort === 'points'
  const caption = `${view.scope === 'global' ? T.rankings.global : T.rankings.following} · ${T.rankings[view.period]}`

  return (
    <div className="flex flex-col items-center pt-6 pb-10 px-4 sm:px-8">
      <div className="w-full flex flex-col gap-[1.125rem]">
        <header className="flex flex-col gap-3 enter-rows">
          <h1 className="flex items-center gap-2.5 font-display italic font-extrabold text-5xl sm:text-[4.5rem] leading-[0.88] pr-1">
            {T.rankings.title}
            <span className="not-italic font-sans inline-flex items-center h-[1.375rem] px-2 rounded-tag text-xs font-bold bg-accent/15 text-accent">{T.rankings.beta}</span>
          </h1>
          <p className="text-sm sm:text-[0.9375rem] text-text-secondary">
            {T.rankings.intro}{' '}
            <Link href="/rankings/how" className="font-bold text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              {T.rankings.how}
            </Link>
          </p>
        </header>

        <RankingsPageToolbar view={view} onChange={setView} signedIn={signedIn} xbox={xbox} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          <div className="flex flex-col gap-[1.125rem] min-w-0">
            {isLoading ? (
              <RankingsPageSkeleton podium={view.scope === 'global'} />
            ) : error ? (
              <div className="bg-bg-card rounded-card flex flex-col items-center gap-2 py-10 text-center">
                <p role="alert" className="text-sm text-danger">{T.rankings.loadError}</p>
                <button onClick={retry} className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
                  {T.rankings.retry}
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div className="bg-bg-card rounded-card">
                <EmptyState
                  icon={view.scope === 'following' ? <IconUsers className="w-6 h-6" /> : <IconTrophy className="w-6 h-6" />}
                  title={T.rankings.empty}
                  subtitle={view.scope === 'following' ? T.rankings.emptyFollowing : undefined}
                  className="py-12"
                />
              </div>
            ) : (
              <>
                {podium.length > 0 && <RankingsPagePodium rows={podium} linked approx={approx} />}
                {rest.length > 0 && (
                  <>
                    <div className="hidden md:block">
                      <RankingsPageTable rows={rest} arrows={data?.arrows ?? false} linked caption={caption} approx={approx} />
                    </div>
                    <div className="md:hidden">
                      <RankingsPageList rows={rest} arrows={data?.arrows ?? false} linked approx={approx} />
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

            {me && zone.some((r) => r.isMe) && !isLoading && (
              <div className="enter-rise [--i:8]">
                <RankingsPageZone
                  me={me}
                  rows={zone}
                  total={total}
                  upLeft={Math.max(0, upLeft)}
                  downLeft={Math.max(0, downLeft)}
                  onWiden={widen}
                  widening={widening}
                  arrows={data?.arrows ?? false}
                  linked
                  approx={approx}
                  byPoints={view.sort === 'points'}
                />
              </div>
            )}
            {me && !meShown && !me.listed && !isLoading && (
              <div className="sticky bottom-3 z-20 enter-rise [--i:8]">
                <RankingsPageMeBar me={me} above={above} showInRankings={vault?.showInRankings !== false} />
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 enter-card [--i:4]">
            {signedIn ? vault && <RankingsPageLevelPanel me={vault} /> : <RankingsPageJoin />}
            {(data?.hot ?? []).length > 0 && (
              <RankingsPageHot rows={data?.hot ?? []} linked onSeeWeek={weekView ? undefined : () => setView({ scope: 'global', period: 'week', source: 'all', sort: 'points' })} />
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
