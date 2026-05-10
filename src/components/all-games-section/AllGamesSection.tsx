'use client'

import { useMemo, useState } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { CategoryGame } from '@/hooks/useGamesByCategory'
import { GameExtraData } from '@/components/statusGameList/StatusGameList'
import StatusGameList from '@/components/statusGameList/StatusGameList'
import CompletedFilter, { CompletedMode } from '@/components/completed-filter/CompletedFilter'
import ConsoleFilter, { buildConsolePills } from '@/components/console-filter/ConsoleFilter'
import Spinner from '@/components/main-spinner/Spinner'
import { useConsoleFilter } from '@/hooks/useConsoleFilter'
import { motion } from 'framer-motion'

type Category = 'wantToPlay' | 'playing' | 'completed'

const CATEGORY_META: Record<Category, { label: string; icon: string; badge: string }> = {
  wantToPlay: { label: 'Quiero jugar',   icon: '🔖', badge: 'bg-purple-900/50 text-purple-300' },
  playing:    { label: 'Jugando',        icon: '🎮', badge: 'bg-blue-900/50   text-blue-300'   },
  completed:  { label: 'Completados',    icon: '🏆', badge: 'bg-green-900/50  text-green-300'  },
}

export default function AllGamesSection({
  category,
  games,
  loading,
  extraData,
}: {
  category: Category
  games: CategoryGame[]
  loading: boolean
  extraData: Map<number, GameExtraData>
}) {
  const [open, setOpen] = useState(true)
  const [completedMode, setCompletedMode] = useState<CompletedMode>('all')
  const { selected, toggle, clear } = useConsoleFilter()

  const meta = CATEGORY_META[category]
  const consolePills = useMemo(() => buildConsolePills(games), [games])

  const filtered = useMemo(() => {
    let list = games
    if (selected.size > 0) list = list.filter((g) => selected.has(g.ConsoleID))
    if (category === 'completed' && completedMode !== 'all') {
      list = list.filter((g) => {
        const hc = Number((g as RetroAchievementsGameCompleted).HardcoreMode)
        return completedMode === 'hardcore' ? hc === 1 : hc === 0
      })
    }
    return list
  }, [games, selected, completedMode, category])

  return (
    <motion.div
      className="w-full bg-bg-card rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Section header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bg-header/30 transition-colors cursor-pointer text-left select-none"
      >
        <span className="text-xl">{meta.icon}</span>
        <span className="text-xl font-bold">{meta.label}</span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${meta.badge}`}>
          {loading ? '…' : filtered.length}
        </span>
        <span
          className="ml-auto text-text-secondary text-xs transition-transform duration-300 shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {/* Collapsible body */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-bg-main">
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner size={36} />
              </div>
            ) : games.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-8">Sin juegos</p>
            ) : (
              <>
                {/* Filters row */}
                <div className="flex items-start gap-4 px-5 py-3 flex-wrap border-b border-bg-main/60">
                  <ConsoleFilter
                    pills={consolePills}
                    selected={selected}
                    onToggle={toggle}
                    onClear={clear}
                  />

                  {category === 'completed' && (
                    <div className="shrink-0">
                      <CompletedFilter value={completedMode} onChange={setCompletedMode} />
                    </div>
                  )}
                </div>

                {/* Games list */}
                <div className="flex flex-col items-center gap-3 py-4">
                  {filtered.length === 0 ? (
                    <p className="text-text-secondary text-sm py-4">Sin juegos con ese filtro</p>
                  ) : (
                    <StatusGameList games={filtered} extraData={extraData} category={category} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
