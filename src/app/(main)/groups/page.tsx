'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { IconPlus, IconFolder, IconLock, IconWorld } from '@tabler/icons-react'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { useGroups } from '@/hooks/useGroups'
import { RetroAchievementsGameCompleted } from '@/types/types'
import GroupModal from '@/components/groups/GroupModal'
import GroupIcon from '@/components/groups/group-icon/GroupIcon'
import { relativeTime } from '@/utils/utils'

export default function GroupsPage() {
  const { T } = useLanguage()
  const { groups, isLoading, createGroup } = useGroups()
  const [modalOpen, setModalOpen] = useState(false)

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
      const results = await Promise.allSettled(
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
          }).then((res) => { if (!res.ok) throw new Error(`Failed to add game ${g.GameID}`) })
        )
      )
      results.forEach((r) => {
        if (r.status === 'rejected') console.error('[GroupsPage] add game:', r.reason)
      })
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4">
    <div className="w-full lg:max-w-[98%] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">{T.groups.title}</h1>
          {groups.length > 0 && (
            <p className="text-sm text-text-secondary mt-0.5">
              {groups.length}/10 {T.groups.title.toLowerCase()}
            </p>
          )}
        </div>
        {groups.length < 10 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/70"
          >
            <IconPlus className="w-4 h-4" aria-hidden />
            {T.groups.newGroup}
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 bg-bg-card rounded-xl p-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-3.5 w-40 rounded bg-white/10" />
                <div className="h-2.5 w-24 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center gap-3 py-20 text-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <IconFolder className="w-16 h-16 text-text-secondary opacity-20" aria-hidden />
          <p className="text-lg font-semibold text-text-main">{T.groups.noGroups}</p>
          <p className="text-sm text-text-secondary max-w-xs">{T.groups.noGroupsSub}</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-accent text-bg-main font-medium hover:bg-accent/90 transition-colors"
          >
            {T.groups.newGroup}
          </button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group, i) => (
            <motion.div
              key={group.id}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/groups/${group.id}`}
                className="flex items-center gap-4 bg-bg-card rounded-xl p-4 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <GroupIcon group={group} />
                <div className="flex flex-col min-w-0 flex-1 gap-1">
                  {/* Title row */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                      {group.title}
                    </span>
                    {group.is_public ? (
                      <IconWorld className="w-3.5 h-3.5 text-accent/60 shrink-0" aria-label="Public" />
                    ) : (
                      <IconLock className="w-3.5 h-3.5 text-text-secondary/60 shrink-0" aria-label="Private" />
                    )}
                  </div>

                  {/* Game count */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary shrink-0">
                      {group.game_count} {T.groups.games}
                    </span>
                  </div>

                  {/* Stats + last activity */}
                  <div className="flex items-center gap-2 text-xs text-text-secondary/50">
                    {group.total_possible > 0 && (
                      <>
                        <span>{group.total_awarded}/{group.total_possible} logros</span>
                        <span className="opacity-40">·</span>
                      </>
                    )}
                    <span>{relativeTime(group.updated_at)}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {groups.length < 10 && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-4 bg-bg-card/50 border border-dashed border-white/10 rounded-xl p-4 hover:border-accent/40 hover:bg-bg-card transition-colors text-text-secondary hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent/70"
            >
              <div className="w-14 h-14 rounded-xl bg-bg-main flex items-center justify-center shrink-0">
                <IconPlus className="w-6 h-6" aria-hidden />
              </div>
              <span className="text-sm font-medium">{T.groups.newGroup}</span>
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
    </div>
  )
}
