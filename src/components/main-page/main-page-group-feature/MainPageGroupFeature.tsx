'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { IconArrowRight, IconEdit, IconFolder, IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import { useGroupProgress } from '@/hooks/useGroupProgress'
import type { GameGroup, GameGroupItem } from '@/types/types'
import { itemKey } from '@/utils/groupItems'
import { gameHref } from '@/utils/gameRef'
import { plural } from '@/utils/utils'
import { notify } from '@/lib/notify'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import GroupIcon from '@/components/groups/group-icon/GroupIcon'
import { coverSrc } from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'
import EmptyState from '@/components/empty-state/EmptyState'
import { CircularProgress } from '@/components/ui/CircularProgress'
import MainPageGroupFeatureGame from '@/components/main-page/main-page-group-feature-game/MainPageGroupFeatureGame'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

// Downloaded the first time it is opened, not with the page.
const AddGameModal = dynamic(() => import('@/components/groups/add-game-modal/AddGameModal'), { loading: () => null })
const GroupModal = dynamic(() => import('@/components/groups/GroupModal'), { loading: () => null })

/** Covers shown before a "+N more" tile; small, so a big group still takes a row or two. */
const SHOWN = 11
// At most 88px a cover: RA's icons are 96px, so they are never blown up.
const GRID = 'grid gap-3 grid-cols-[repeat(auto-fill,minmax(4.5rem,5.5rem))]'

/**
 * The group shown in full: its covers faded behind a ring with how far along
 * it is, how many games are finished, started and not started, the game
 * closest to done, and its first games as small covers (a tile says how many more). An empty one can be filled
 * from here, and with `onEdit` its name, icon and privacy edited. `onChanged` is told when games
 * were added, to refresh the counts.
 */
export default function MainPageGroupFeature({
  group,
  onChanged,
  onEdit,
}: {
  group: GameGroup
  onChanged?: () => void
  onEdit?: (data: { title: string; description?: string; icon?: string; is_public?: boolean }) => Promise<unknown>
}) {
  const { T, lang } = useLanguage()
  const { group: detail, isLoading, error } = useGroupDetail(group.id)
  const [added, setAdded] = useState<GameGroupItem[]>([])
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const items = useMemo(() => [...(detail?.items ?? []), ...added], [detail, added])
  const { summary, states, closest, progress } = useGroupProgress(items)
  const covers = useMemo(() => items.map(coverSrc).filter((s): s is string => !!s).slice(0, 6), [items])
  const existingKeys = useMemo(() => new Set(items.map(itemKey)), [items])

  // Until its games are read, the group's own stored totals.
  const counts = items.length > 0 ? summary : { earned: group.total_awarded, total: group.total_possible }
  const pct = counts.total > 0 ? Math.min(100, Math.round((counts.earned / counts.total) * 100)) : null

  /** Errors are thrown back to the modal, which stays open and says why. */
  async function handleEdit(data: { title: string; description: string; icon: string; is_public: boolean }) {
    await onEdit?.({ title: data.title, description: data.description || undefined, icon: data.icon || undefined, is_public: data.is_public })
    notify.success(T.toast.groupSaved)
  }

  function handleAdded(newItems: GameGroupItem[]) {
    setAdded((prev) => [...prev, ...newItems])
    onChanged?.()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-card overflow-hidden ring-1 ring-ink/5 bg-bg-main">
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
          {onEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={T.groups.editGroup}
              className="self-start p-2 rounded-lg bg-bg-card/80 ring-1 ring-ink/10 text-text-secondary hover:text-text-main transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <IconEdit className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {group.description && <p className="text-sm text-text-secondary -mt-1">{group.description}</p>}

      {closest && (
        <Link
          href={gameHref(closest.item.source ?? 'ra', closest.item.game_id)}
          className="flex items-center gap-3 rounded-tile bg-bg-main px-3 py-2.5 hover:bg-ink/5 transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent shrink-0">{T.groups.nextUp}</span>
          <span className="text-sm truncate flex-1">{T.groups.nextUpLeft.replace('{left}', String(closest.left)).replace('{game}', closest.item.title)}</span>
          <IconArrowRight className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
        </Link>
      )}

      {isLoading ? (
        <div className={GRID} aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} radius="tile" className="aspect-square" />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-danger">{T.cards.groupLoadFailed}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2">
          <EmptyState icon={<IconFolder className="w-6 h-6" />} title={T.cards.groupEmpty} size="compact" />
          <Button
            type="button"
            onClick={() => setAdding(true)}
          >
            <IconPlus className="w-4 h-4" aria-hidden="true" />
            {T.groups.addGames}
          </Button>
        </div>
      ) : (
        <ul className={`${GRID} enter-cards`}>
          {items.slice(0, SHOWN).map((item) => (
            <li key={item.id} className="min-w-0">
              <MainPageGroupFeatureGame item={item} progress={progress(item)} />
            </li>
          ))}
          {items.length > SHOWN && (
            <li>
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center justify-center aspect-square rounded-tile border-2 border-dashed border-ink/10 text-sm font-semibold text-text-secondary hover:text-accent hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {T.groups.moreGames.replace('{n}', String(items.length - SHOWN))}
              </Link>
            </li>
          )}
        </ul>
      )}

      <Link
        href={`/groups/${group.id}`}
        className="self-start flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-main transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {T.cards.viewGroup}
        <IconArrowRight size={14} aria-hidden="true" />
      </Link>

      {onEdit && (
        <LazyWhenOpened open={editing}>
          <GroupModal isOpen={editing} onClose={() => setEditing(false)} group={group} onSave={handleEdit} />
        </LazyWhenOpened>
      )}
      <LazyWhenOpened open={adding}>
        <AddGameModal isOpen={adding} onClose={() => setAdding(false)} groupId={group.id} groupTitle={group.title} existingKeys={existingKeys} onAdded={handleAdded} />
      </LazyWhenOpened>
    </div>
  )
}
