'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconPlus, IconFolder, IconTrash } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGroups } from '@/hooks/useGroups'
import { GameGroup, RetroAchievementsGameCompleted } from '@/types/types'
import GroupModal from '@/components/groups/GroupModal'
import { relativeTime } from '@/utils/utils'

function isImageUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

function GroupIcon({ group }: { group: GameGroup }) {
  const icon = group.icon
  if (icon) {
    if (isImageUrl(icon)) {
      return (
        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-bg-main">
          <Image src={icon} alt={group.title} width={36} height={36} className="w-full h-full object-cover" unoptimized />
        </div>
      )
    }
    return (
      <div className="w-9 h-9 rounded-lg bg-bg-main flex items-center justify-center shrink-0 text-xl leading-none">
        {icon}
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-bg-main flex items-center justify-center shrink-0">
      <IconFolder className="w-5 h-5 text-text-secondary" aria-hidden />
    </div>
  )
}

export default function MainPageGroups({ isLoading: externalLoading }: { isLoading?: boolean }) {
  const { T } = useLanguage()
  const { groups, isLoading, createGroup, deleteGroup } = useGroups()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)

  async function handleDelete(id: number) {
    await deleteGroup(id)
    setConfirmingDelete(null)
  }

  const loading = externalLoading || isLoading

  async function handleCreate(data: {
    title: string
    description: string
    icon: string
    is_public: boolean
    initialGames?: RetroAchievementsGameCompleted[]
  }) {
    const group = await createGroup({
      title: data.title,
      description: data.description || undefined,
      icon: data.icon || undefined,
      is_public: data.is_public,
    })

    if (data.initialGames?.length) {
      await Promise.all(
        data.initialGames.map((g) =>
          fetch(`/api/groups/${group.id}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              game_id: g.GameID,
              title: g.Title,
              image_icon: g.ImageIcon,
              console_name: g.ConsoleName,
              pct_won: parseFloat(g.PctWon),
              num_awarded: g.NumAwarded,
              max_possible: g.MaxPossible,
            }),
          })
        )
      )
    }
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
              <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
              <div className="flex flex-col flex-1 gap-1.5">
                <div className="h-2.5 w-28 rounded bg-white/10" />
                <div className="h-2 w-16 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-4">
          <IconFolder className="w-8 h-8 text-text-secondary opacity-30" aria-hidden />
          <p className="text-xs text-text-secondary">{T.groups.noGroups}</p>
          <p className="text-[10px] text-text-secondary opacity-60">{T.groups.noGroupsSub}</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-1 px-3 py-1.5 rounded-lg bg-accent text-bg-main text-xs font-medium hover:bg-accent/90 transition-colors"
          >
            {T.groups.newGroup}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {groups.slice(0, 4).map((group) => (
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
                  <Link
                    href={`/groups/${group.id}`}
                    className="flex items-center gap-2.5 bg-bg-main rounded-lg p-2 pr-8 hover:bg-white/5 transition-colors group/link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    <GroupIcon group={group} />
                    <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                      <span className="text-xs font-semibold truncate group-hover/link:text-accent transition-colors">
                        {group.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-text-secondary shrink-0">
                          {group.game_count} {T.groups.games}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary/50">
                        {group.total_possible > 0 && (
                          <span>{group.total_awarded}/{group.total_possible}</span>
                        )}
                        {group.total_possible > 0 && <span className="opacity-40">·</span>}
                        <span>{relativeTime(group.updated_at)}</span>
                      </div>
                    </div>
                  </Link>
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
          {groups.length > 4 ? (
            <Link
              href="/groups"
              className="flex items-center gap-2.5 bg-bg-main rounded-lg p-2 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <div className="w-9 h-9 rounded-lg bg-bg-card flex items-center justify-center shrink-0">
                <IconFolder className="w-4 h-4 text-text-secondary" aria-hidden />
              </div>
              <span className="text-xs text-text-secondary hover:text-text-main transition-colors">
                +{groups.length - 4} {T.groups.title.toLowerCase()} más →
              </span>
            </Link>
          ) : groups.length < 10 && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-bg-main/50 border border-dashed border-white/10 rounded-lg p-2 hover:border-accent/40 hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent/70"
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
