'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconPlus, IconFolder, IconTrash } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGroups } from '@/hooks/useGroups'
import type { GameCandidate } from '@/utils/gameCandidates'
import { addGamesToGroup } from '@/utils/apiCallsUtils'
import GroupModal from '@/components/groups/GroupModal'
import { relativeTime, plural } from '@/utils/utils'
import EmptyState from '@/components/empty-state/EmptyState'
import GroupIcon from '@/components/groups/group-icon/GroupIcon'
import MainPageGroupsRow from './main-page-groups-row/MainPageGroupsRow'
import { notify } from '@/lib/notify'

/**
 * The user's groups as a list, with creating and deleting at hand. Given
 * `onSelect`, a row picks which group is shown in full beside it (the Groups
 * section) instead of opening it, and every group is listed; without it,
 * rows open their group and the list stops at four.
 */
export default function MainPageGroups({
  isLoading: externalLoading,
  selectedId,
  onSelect,
}: {
  isLoading?: boolean
  selectedId?: number | null
  onSelect?: (id: number) => void
}) {
  const { T, lang } = useLanguage()
  const { groups, isLoading, createGroup, deleteGroup } = useGroups()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)

  async function handleDelete(id: number) {
    try {
      await deleteGroup(id)
      notify.success(T.toast.groupDeleted)
    } catch {
      notify.error(T.toast.groupDeleteFailed)
    } finally {
      setConfirmingDelete(null)
    }
  }

  const loading = externalLoading || isLoading

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
        {!loading && groups.length < 10 && (
          <button
            onClick={() => setModalOpen(true)}
            className="p-1 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent/70"
            aria-label={T.groups.newGroup}
          >
            <IconPlus className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {loading ? (
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
            <div key={group.id} className="group/card relative">
              {confirmingDelete === group.id ? (
                <div className="flex items-center justify-between bg-bg-main rounded-lg p-2 gap-2">
                  <span className="text-xs text-text-secondary truncate">{T.groups.confirmDelete}</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setConfirmingDelete(null)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-bg-card text-text-secondary hover:text-text-main transition-colors"
                    >
                      {T.groups.cancel}
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      {T.groups.deleteGroup}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <MainPageGroupsRow
                    href={`/groups/${group.id}`}
                    onSelect={onSelect && (() => onSelect(group.id))}
                    selected={selectedId === group.id}
                  >
                    <GroupIcon group={group} />
                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                      <span className="text-xs font-semibold truncate group-hover/link:text-accent transition-colors">
                        {group.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-text-secondary shrink-0">
                          {plural(group.game_count, T.plurals.games, lang)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                        {group.total_possible > 0 && (
                          <span>{group.total_awarded}/{group.total_possible}</span>
                        )}
                        {group.total_possible > 0 && <span className="opacity-40">·</span>}
                        <span>{relativeTime(group.updated_at, lang)}</span>
                      </div>
                    </div>
                  </MainPageGroupsRow>
                  <button
                    onClick={() => setConfirmingDelete(group.id)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover/card:opacity-100 transition-all focus:opacity-100"
                    aria-label={T.groups.deleteGroup}
                  >
                    <IconTrash className="w-3.5 h-3.5" aria-hidden />
                  </button>
                </>
              )}
            </div>
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

      <GroupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreate}
      />
    </div>
  )
}

