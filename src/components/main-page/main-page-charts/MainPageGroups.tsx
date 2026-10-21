'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { IconPlus, IconFolder } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { useGroups } from '@/hooks/useGroups'
import type { GameGroup } from '@/types/types'
import type { GameCandidate } from '@/utils/gameCandidates'
import { addGamesToGroup } from '@/utils/apiCallsUtils'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'

// Downloaded the first time it is opened, not with the page.
const GroupModal = dynamic(() => import('@/components/groups/GroupModal'), { loading: () => null })
import { relativeTime, plural } from '@/utils/utils'
import EmptyState from '@/components/empty-state/EmptyState'
import GroupIcon from '@/components/groups/group-icon/GroupIcon'
import GroupProgressBar from '@/components/groups/group-progress-bar/GroupProgressBar'
import MainPageGroupsRow from './main-page-groups-row/MainPageGroupsRow'
import { notify } from '@/lib/notify'

/**
 * The user's groups as a list, with creating one at hand (deleting is on the
 * group's page). Given `onSelect`, a row picks which group is shown in full
 * beside it (the Groups section) instead of opening it, and every group is
 * listed; without it, rows open their group and the list stops at four.
 * The groups come from the caller, so the section asks for them once.
 */
export default function MainPageGroups({
  groups,
  isLoading,
  createGroup,
  selectedId,
  onSelect,
}: {
  groups: GameGroup[]
  isLoading: boolean
  createGroup: ReturnType<typeof useGroups>['createGroup']
  selectedId?: number | null
  onSelect?: (id: number) => void
}) {
  const { T, lang } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)
  
  async function handleCreate(data: {
    title: string
    description: string
    icon: string
    is_public: boolean
    initialGames?: GameCandidate[]
  }) {
    const group = await createGroup({
      title: data.title,
      description: data.description || undefined,
      icon: data.icon || undefined,
      is_public: data.is_public,
    })

    const failed = data.initialGames?.length ? await addGamesToGroup(group.id, data.initialGames) : []
    if (failed.length) notify.error(T.toast.someGamesFailed)
    else notify.success(T.toast.groupCreated)
  }

  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="flex items-center justify-between">
        <Link
          href="/groups"
          className="text-[10px] uppercase tracking-widest text-text-secondary hover:text-text-main transition-colors"
        >
          {T.groups.title}
        </Link>
        {!isLoading && groups.length < 10 && (
          <button
            onClick={() => setModalOpen(true)}
            className="p-1 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent/70"
            aria-label={T.groups.newGroup}
          >
            <IconPlus className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 bg-bg-main rounded-lg p-2">
              <div className="w-9 h-9 rounded-lg bg-ink/10 shrink-0" />
              <div className="flex flex-col flex-1 gap-1.5">
                <div className="h-2.5 w-28 rounded bg-ink/10" />
                <div className="h-2 w-16 rounded bg-ink/10" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-1 py-4">
          <EmptyState
            icon={<IconFolder className="w-6 h-6" />}
            title={T.groups.noGroups}
            subtitle={T.groups.noGroupsSub}
            size="compact"
          />
          <button
            onClick={() => setModalOpen(true)}
            className="mt-1 px-3 py-1.5 rounded-lg bg-accent text-bg-main text-xs font-medium hover:bg-accent/90 transition-colors"
          >
            {T.groups.newGroup}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {(onSelect ? groups : groups.slice(0, 4)).map((group) => (
            <MainPageGroupsRow
              key={group.id}
              href={`/groups/${group.id}`}
              onSelect={onSelect && (() => onSelect(group.id))}
              selected={selectedId === group.id}
            >
              <GroupIcon group={group} />
              <div className="flex flex-col min-w-0 flex-1 gap-1">
                <span className="text-xs font-semibold truncate group-hover/link:text-accent transition-colors">
                  {group.title}
                </span>
                <span className="text-[10px] text-text-secondary truncate">
                  {plural(group.game_count, T.plurals.games, lang)} · {relativeTime(group.updated_at, lang)}
                </span>
                <GroupProgressBar earned={group.total_awarded} total={group.total_possible} label={group.title} />
              </div>
            </MainPageGroupsRow>
          ))}
          {!onSelect && groups.length > 4 ? (
            <Link
              href="/groups"
              className="flex items-center gap-2.5 bg-bg-main rounded-lg p-2 hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <div className="w-9 h-9 rounded-lg bg-bg-card flex items-center justify-center shrink-0">
                <IconFolder className="w-4 h-4 text-text-secondary" aria-hidden />
              </div>
              <span className="text-xs text-text-secondary hover:text-text-main transition-colors">
                {T.cards.moreMatches.replace('{n}', String(groups.length - 4))} →
              </span>
            </Link>
          ) : groups.length < 10 && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-bg-main/50 border border-dashed border-ink/10 rounded-lg p-2 hover:border-accent/40 hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent/70"
            >
              <div className="w-9 h-9 rounded-lg bg-bg-card flex items-center justify-center shrink-0">
                <IconPlus className="w-4 h-4" aria-hidden />
              </div>
              <span className="text-xs">{T.groups.newGroup}</span>
            </button>
          )}
        </div>
      )}

      <LazyWhenOpened open={modalOpen}>
        <GroupModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleCreate}
        />
      </LazyWhenOpened>
    </div>
  )
}

