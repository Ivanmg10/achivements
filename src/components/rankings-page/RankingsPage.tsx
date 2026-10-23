'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MotionConfig, motion } from 'framer-motion'
import { IconInfoCircle, IconTrophy, IconUsers } from '@tabler/icons-react'
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
import { ME_BAR, SIDE } from './rankingsMotion'

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
    <MotionConfig reducedMotion="user">
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
            <Link
              href="/rankings/how"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-bg-card text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <IconInfoCircle size={14} aria-hidden="true" />
              {T.rankings.how}
            </Link>
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
                <motion.div variants={ME_BAR} initial="hidden" animate="show">
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
                </motion.div>
              )}
              {me && !meShown && !me.listed && !isLoading && (
                <motion.div variants={ME_BAR} initial="hidden" animate="show" className="sticky bottom-3 z-20">
                  <RankingsPageMeBar me={me} above={above} showInRankings={vault?.showInRankings !== false} />
                </motion.div>
              )}
            </div>

            <motion.aside variants={SIDE} initial="hidden" animate="show" className="flex flex-col gap-4 lg:sticky lg:top-24">
              {signedIn ? vault && <RankingsPageLevelPanel me={vault} /> : <RankingsPageJoin />}
              {(data?.hot ?? []).length > 0 && (
                <RankingsPageHot rows={data?.hot ?? []} linked onSeeWeek={weekView ? undefined : () => setView({ scope: 'global', period: 'week', source: 'all', sort: 'points' })} />
              )}
            </motion.aside>
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
