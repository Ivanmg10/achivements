'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { IconFolder, IconLayoutGrid, IconLayoutRows, IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGroups } from '@/hooks/useGroups'
import { useStoredChoice } from '@/hooks/useStoredChoice'
import type { GameCandidate } from '@/utils/gameCandidates'
import { addGamesToGroup } from '@/utils/apiCallsUtils'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'

// Downloaded the first time it is opened, not with the page.
const GroupModal = dynamic(() => import('@/components/groups/GroupModal'), { loading: () => null })
import GroupListSkeleton from '@/components/groups/group-list-skeleton/GroupListSkeleton'
import GroupList from '@/components/groups/group-list/GroupList'
import EmptyState from '@/components/empty-state/EmptyState'
import GroupViewToggle, { GROUP_VIEWS, type GroupView } from '@/components/groups/group-view-toggle/GroupViewToggle'
import { notify } from '@/lib/notify'
import { GROUPS_PER_USER_MAX } from '@/utils/groupValidation'
import Button from '@/components/ui/Button'

export default function GroupsPage() {
  const { T } = useLanguage()
  const { groups, isLoading, error, createGroup, fetchGroups } = useGroups()
  const canCreate = groups.length < GROUPS_PER_USER_MAX
  const [modalOpen, setModalOpen] = useState(false)
  const [view, setView] = useStoredChoice<GroupView>('groups-view', GROUP_VIEWS, 'covers')

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
          <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[0.95] pr-1 text-text-main">{T.groups.title}</h1>
          {groups.length > 0 && (
            <p className="text-sm text-text-secondary mt-0.5">
              {groups.length}/{GROUPS_PER_USER_MAX} {T.groups.title.toLowerCase()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <GroupViewToggle
              value={view}
              onChange={setView}
              options={[
                { value: 'covers', label: T.groups.viewCovers, icon: IconLayoutGrid },
                { value: 'shelves', label: T.groups.viewShelves, icon: IconLayoutRows },
              ]}
            />
          )}
          {canCreate && (
            <Button
              onClick={() => setModalOpen(true)}
            >
              <IconPlus className="w-4 h-4" aria-hidden="true" />
              {T.groups.newGroup}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <GroupListSkeleton />
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
            icon={<IconFolder className="w-7 h-7" />}
            title={T.groups.noGroups}
            subtitle={T.groups.noGroupsSub}
            className="min-h-[40vh]"
          />
          <Button
            onClick={() => setModalOpen(true)}
            className="mx-auto"
          >
            {T.groups.newGroup}
          </Button>
        </>
      ) : (
        <GroupList
          groups={groups}
          view={view}
          remaining={GROUPS_PER_USER_MAX - groups.length}
          onCreate={() => setModalOpen(true)}
        />
      )}

      <LazyWhenOpened open={modalOpen}>
        <GroupModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleCreate}
        />
      </LazyWhenOpened>
    </div>
    </div>
  )
}
