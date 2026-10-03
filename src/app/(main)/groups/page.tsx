'use client'

import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGroups } from '@/hooks/useGroups'
import type { GameCandidate } from '@/utils/gameCandidates'
import { addGamesToGroup } from '@/utils/apiCallsUtils'
import GroupModal from '@/components/groups/GroupModal'
import GroupList from '@/components/groups/group-list/GroupList'
import EmptyState from '@/components/empty-state/EmptyState'
import StatusGridControl, { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import { notify } from '@/lib/notify'
import { GROUPS_PER_USER_MAX } from '@/utils/groupValidation'

export default function GroupsPage() {
  const { T } = useLanguage()
  const { groups, isLoading, error, createGroup, fetchGroups } = useGroups()
  const canCreate = groups.length < GROUPS_PER_USER_MAX
  const [modalOpen, setModalOpen] = useState(false)
  const [gridCols, setGridCols] = useState<StatusGridCols>(2)

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
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4">
    <div className="w-full lg:max-w-[98%] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-main">{T.groups.title}</h1>
          {groups.length > 0 && (
            <p className="text-sm text-text-secondary mt-0.5">
              {groups.length}/{GROUPS_PER_USER_MAX} {T.groups.title.toLowerCase()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {groups.length > 0 && <StatusGridControl cols={gridCols} onChange={setGridCols} />}
          {canCreate && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <IconPlus className="w-4 h-4" aria-hidden="true" />
              {T.groups.newGroup}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div role="status" aria-busy="true" className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] animate-pulse motion-reduce:animate-none">
          <span className="sr-only">{T.loadingPage.title}</span>
          {[0, 1, 2].map((i) => (
            <div key={i} aria-hidden="true" className="flex items-center gap-4 bg-bg-card rounded-2xl p-3">
              <div className="w-24 h-24 rounded-xl bg-ink/10 shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-3.5 w-40 rounded bg-ink/10" />
                <div className="h-2.5 w-24 rounded bg-ink/10" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 mt-10 text-center">
          <p role="alert" className="text-sm text-text-secondary">{T.groups.listError}</p>
          <button onClick={fetchGroups} className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
            {T.groups.retry}
          </button>
        </div>
      ) : groups.length === 0 ? (
        <>
          <EmptyState
            icon="📁"
            title={T.groups.noGroups}
            subtitle={T.groups.noGroupsSub}
            className="min-h-[40vh]"
          />
          <button
            onClick={() => setModalOpen(true)}
            className="mx-auto px-5 py-2.5 rounded-xl bg-accent text-bg-main font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {T.groups.newGroup}
          </button>
        </>
      ) : (
        <GroupList groups={groups} gridCols={gridCols} />
      )}

      <GroupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreate}
      />
    </div>
    </div>
  )
}
