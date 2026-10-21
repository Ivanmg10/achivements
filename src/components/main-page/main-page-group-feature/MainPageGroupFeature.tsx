'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { IconArrowRight, IconFolder, IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import { useGroupProgress } from '@/hooks/useGroupProgress'
import type { GameGroup, GameGroupItem } from '@/types/types'
import { itemKey } from '@/utils/groupItems'
import { gameHref } from '@/utils/gameRef'
import { plural } from '@/utils/utils'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import GroupIcon from '@/components/groups/group-icon/GroupIcon'
import { coverSrc } from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'
import EmptyState from '@/components/empty-state/EmptyState'
import { CircularProgress } from '@/components/ui/CircularProgress'
import MainPageGroupFeatureGame from '@/components/main-page/main-page-group-feature-game/MainPageGroupFeatureGame'

// Downloaded the first time it is opened, not with the page.
const AddGameModal = dynamic(() => import('@/components/groups/add-game-modal/AddGameModal'), { loading: () => null })

/** Games shown before "N more": one row of covers on a wide card. */
const SHOWN = 6

/**
 * The group shown in full: its covers faded behind a ring with how far along
 * it is, how many games are finished, started and not started, the game
 * closest to done, and its first games as covers. An empty one can be filled
 * from here. `onChanged` is told when games were added, to refresh the counts.
 */
export default function MainPageGroupFeature({ group, onChanged }: { group: GameGroup; onChanged?: () => void }) {
  const { T, lang } = useLanguage()
  const { group: detail, isLoading, error } = useGroupDetail(group.id)
  const [added, setAdded] = useState<GameGroupItem[]>([])
  const [adding, setAdding] = useState(false)
  const items = useMemo(() => [...(detail?.items ?? []), ...added], [detail, added])
  const { summary, states, closest, progress } = useGroupProgress(items)
  const covers = useMemo(() => items.map(coverSrc).filter((s): s is string => !!s).slice(0, 6), [items])
  const existingKeys = useMemo(() => new Set(items.map(itemKey)), [items])

  // Until its games are read, the group's own stored totals.
  const counts = items.length > 0 ? summary : { earned: group.total_awarded, total: group.total_possible }
  const pct = counts.total > 0 ? Math.min(100, Math.round((counts.earned / counts.total) * 100)) : null

  function handleAdded(newItems: GameGroupItem[]) {
    setAdded((prev) => [...prev, ...newItems])
    onChanged?.()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-2xl overflow-hidden ring-1 ring-ink/5 bg-bg-main">
        {covers.length > 0 && (
          <div aria-hidden="true" className="absolute inset-0 grid opacity-25" style={{ gridTemplateColumns: `repeat(${covers.length}, minmax(0, 1fr))` }}>
            {covers.map((src, i) => (
              <Image key={i} src={src} alt="" width={160} height={160} className="w-full h-full object-cover blur-[2px]" unoptimized />
            ))}
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-bg-main via-bg-main/80 to-bg-main/30" />
        <div className="relative flex items-center gap-4 p-4">
          {pct !== null ? (
            <CircularProgress
              earned={counts.earned}
              total={counts.total}
              size={76}
              strokeWidth={7}
              ariaLabel={`${pct}%`}
              center={<span className={`text-base font-bold ${pct >= 100 ? 'text-success' : 'text-text-main'}`}>{pct}%</span>}
            />
          ) : (
            <GroupIcon group={group} />
          )}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <h3 className="text-lg font-bold tracking-tight truncate">
              <Link
                href={`/groups/${group.id}`}
                className="hover:underline underline-offset-2 decoration-text-main/40 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {group.title}
              </Link>
            </h3>
            <p className="text-xs text-text-secondary truncate">
              {plural(items.length || group.game_count, T.plurals.games, lang)}
              {counts.total > 0 && ` · ${T.groups.summary.replace('{earned}', counts.earned.toLocaleString(lang)).replace('{total}', counts.total.toLocaleString(lang))}`}
            </p>
            {items.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 mt-1 text-[11px]">
                <li className="px-2 py-0.5 rounded-full bg-success/15 text-success">{T.groups.completedCount.replace('{n}', String(states.done))}</li>
                <li className="px-2 py-0.5 rounded-full bg-bg-card text-text-main">{T.groups.startedCount.replace('{n}', String(states.started))}</li>
                <li className="px-2 py-0.5 rounded-full bg-bg-card text-text-main">{T.groups.notStartedCount.replace('{n}', String(states.notStarted))}</li>
              </ul>
            )}
          </div>
        </div>
      </div>
      {group.description && <p className="text-sm text-text-secondary -mt-1">{group.description}</p>}

      {closest && (
        <Link
          href={gameHref(closest.item.source ?? 'ra', closest.item.game_id)}
          className="flex items-center gap-3 rounded-xl bg-bg-main px-3 py-2.5 hover:bg-ink/5 transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent shrink-0">{T.groups.nextUp}</span>
          <span className="text-sm truncate flex-1">{T.groups.nextUpLeft.replace('{left}', String(closest.left)).replace('{game}', closest.item.title)}</span>
          <IconArrowRight className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
        </Link>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 animate-pulse motion-reduce:animate-none" aria-busy="true">
          {Array.from({ length: SHOWN }, (_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-ink/10" />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-danger">{T.cards.groupLoadFailed}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2">
          <EmptyState icon={<IconFolder className="w-6 h-6" />} title={T.cards.groupEmpty} size="compact" />
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-accent text-bg-main text-sm font-semibold hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconPlus className="w-4 h-4" aria-hidden="true" />
            {T.groups.addGames}
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {items.slice(0, SHOWN).map((item) => (
            <li key={item.id} className="min-w-0">
              <MainPageGroupFeatureGame item={item} progress={progress(item)} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/groups/${group.id}`}
        className="self-start flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-main transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {items.length > SHOWN ? `${T.cards.viewGroup} (${T.cards.moreMatches.replace('{n}', String(items.length - SHOWN))})` : T.cards.viewGroup}
        <IconArrowRight size={14} aria-hidden="true" />
      </Link>

      <LazyWhenOpened open={adding}>
        <AddGameModal isOpen={adding} onClose={() => setAdding(false)} groupId={group.id} groupTitle={group.title} existingKeys={existingKeys} onAdded={handleAdded} />
      </LazyWhenOpened>
    </div>
  )
}
