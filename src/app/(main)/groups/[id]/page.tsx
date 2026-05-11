'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconGripVertical,
  IconX,
  IconLock,
  IconWorld,
  IconCheck,
} from '@tabler/icons-react'
import { fadeUp } from '@/lib/animations'
import { relativeTime } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import { useGroups } from '@/hooks/useGroups'
import { useGamesData } from '@/contexts/GamesDataContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import {
  GameGroup,
  GameGroupItem,
  RetroAchievementsGameCompleted,
  WantToPlayGame,
} from '@/types/types'
import GroupModal from '@/components/groups/GroupModal'
import AchievementModal from '@/components/achievement-modal/AchievementModal'
import { CONSOLES } from '@/constants'
import { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'

type PctFilter = 'all' | '0' | 'progress' | '100'
type DecadeFilter = 'all' | '80s' | '90s' | '00s' | '10s' | '20s'

function getDecade(year: number): DecadeFilter {
  if (year < 1990) return '80s'
  if (year < 2000) return '90s'
  if (year < 2010) return '00s'
  if (year < 2020) return '10s'
  return '20s'
}

function isImageUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

function GroupIconDisplay({ icon }: { icon?: string | null }) {
  if (!icon) return <span className="text-4xl leading-none">📁</span>
  if (isImageUrl(icon)) {
    return (
      <Image
        src={icon}
        alt="icon"
        width={56}
        height={56}
        className="w-14 h-14 rounded-xl object-cover"
        unoptimized
      />
    )
  }
  return <span className="text-4xl leading-none">{icon}</span>
}

function SortableItem({
  item,
  onRemove,
  draggable,
  achStats,
  ptsStats,
  lastPlayed,
}: {
  item: GameGroupItem
  onRemove: (id: number) => void
  draggable: boolean
  achStats?: { earned: number; total: number }
  ptsStats?: { earned: number; total: number }
  lastPlayed?: string
}) {
  const { T } = useLanguage()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !draggable,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const consoleIcon = CONSOLES.find((c) => c.name === item.console_name)?.icon

  const achEarned = achStats?.earned ?? item.num_awarded
  const achTotal = achStats?.total || item.max_possible
  const pct = achTotal > 0
    ? Math.min(Math.round((achEarned / achTotal) * 100), 100)
    : Math.min(Math.round(parseFloat(item.pct_won) * 100), 100)
  const isComplete = pct >= 100
  const ptsEarned = ptsStats?.earned ?? item.points_won
  const ptsTotal = ptsStats?.total || item.max_points

  const [open, setOpen] = useState(false)
  const [gameData, setGameData] = useState<RetroAchievementsGameWithAchievements | null>(null)
  const [loadingAch, setLoadingAch] = useState(false)
  const [selectedAch, setSelectedAch] = useState<RetroAchievement | null>(null)
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set())
  const [tooltip, setTooltip] = useState<{ achievement: RetroAchievement; x: number; y: number } | null>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleAchEnter(a: RetroAchievement, x: number, y: number) {
    hoverTimeout.current = setTimeout(() => setTooltip({ achievement: a, x, y }), 450)
  }
  function handleAchLeave() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setTooltip(null)
  }

  useEffect(() => {
    if (!open || favoritedIds.size > 0) return
    fetch(`/api/favorites?gameId=${item.game_id}`)
      .then((r) => r.json())
      .then((rows: { achievement_id: number }[]) =>
        setFavoritedIds(new Set(rows.map((r) => r.achievement_id)))
      )
      .catch(() => {})
  }, [open, item.game_id, favoritedIds.size])

  async function handleToggle() {
    if (!open && !gameData) {
      setOpen(true)
      setLoadingAch(true)
      const data = await fetch(`/api/getGameProgression?gameId=${item.game_id}`).then((r) =>
        r.json()
      )
      setGameData(data)
      setLoadingAch(false)
    } else {
      setOpen((o) => !o)
    }
  }

  async function handleToggleFavorite(achievement: RetroAchievement) {
    const isFav = favoritedIds.has(achievement.ID)
    setFavoritedIds((prev) => {
      const next = new Set(prev)
      isFav ? next.delete(achievement.ID) : next.add(achievement.ID)
      return next
    })
    if (isFav) {
      await fetch(`/api/favorites?achievementId=${achievement.ID}`, { method: 'DELETE' })
    } else {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          achievement,
          gameId: item.game_id,
          gameTitle: item.title,
          numDistinctPlayers: gameData?.NumDistinctPlayers ?? 1,
        }),
      })
    }
  }

  const achievements = gameData
    ? Object.values(gameData.Achievements ?? {})
        .filter((a): a is RetroAchievement => !!a)
        .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
    : []

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-bg-card w-full rounded-xl overflow-hidden hover:ring-1 hover:ring-white/10 transition-shadow group ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
    >
      {/* Main row — clickable to expand */}
      <div
        onClick={handleToggle}
        className="flex items-center gap-3 p-5 cursor-pointer hover:bg-bg-header/20 transition-colors select-none"
      >
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-text-secondary/30 hover:text-text-secondary/70 transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none self-stretch flex items-center"
            aria-label="Drag to reorder"
          >
            <IconGripVertical className="w-4 h-4" aria-hidden />
          </button>
        )}

        <Link
          href={`/gameInfo/${item.game_id}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded-xl hover:ring-2 hover:ring-white/40 transition-all"
        >
          {item.image_icon ? (
            <Image
              src={`https://retroachievements.org${item.image_icon}`}
              alt={item.title}
              width={96}
              height={96}
              className="w-24 h-24 rounded-xl object-cover block"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-bg-main" />
          )}
        </Link>

        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <Link
            href={`/gameInfo/${item.game_id}`}
            onClick={(e) => e.stopPropagation()}
            className="self-start hover:underline decoration-white/50 underline-offset-2"
          >
            <p className="text-xl font-semibold leading-tight">{item.title}</p>
          </Link>
          {/* Console name */}
          {item.console_name && (
            <div className="flex items-center gap-1.5">
              {consoleIcon && (
                <Image
                  src={consoleIcon}
                  alt={item.console_name}
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 object-contain opacity-60"
                />
              )}
              <p className="text-xs text-text-secondary/70 uppercase tracking-wide">
                {item.console_name}
              </p>
            </div>
          )}
          {/* Progress bar — own row so all bars start/end at same position */}
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-full max-w-200 h-2 bg-bg-main rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${isComplete ? 'bg-green-500' : pct > 0 ? 'bg-accent' : 'bg-white/10'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary/60 tabular-nums">{pct}%</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2 text-xs text-text-secondary/50">
            {achTotal > 0 ? (
              <span>
                {achEarned}/{achTotal} logros
              </span>
            ) : (
              <span>— logros</span>
            )}
            <span className="opacity-90">·</span>
            {ptsTotal > 0 ? (
              <span>
                {ptsEarned}/{ptsTotal} pts
              </span>
            ) : (
              <span>— pts</span>
            )}
            <span className="opacity-90">·</span>
            <span>{lastPlayed ? relativeTime(lastPlayed) : 'No lo has jugado aun'}</span>
            <span className="ml-auto text-[10px] text-text-secondary/60">
              +{relativeTime(item.added_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(item.id)
            }}
            className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
            aria-label="Remove game"
          >
            <IconX className="w-4 h-4" aria-hidden />
          </button>
          <span
            className="text-text-secondary/50 text-xs transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Accordion */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="border-t border-bg-main px-4 py-4">
            {loadingAch ? (
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg bg-bg-main animate-pulse" />
                ))}
              </div>
            ) : achievements.length === 0 ? (
              <p className="text-center text-text-secondary text-sm py-2">
                {T.statusGameItem.noPublishedAchievements}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {achievements.map((a) => {
                  const isHardcore = !!a.DateEarnedHardcore
                  const isSoftcore = !!a.DateEarned && !a.DateEarnedHardcore
                  const earnedAny = isHardcore || isSoftcore
                  return (
                    <div
                      key={a.ID}
                      onMouseEnter={(e) => handleAchEnter(a, e.clientX, e.clientY)}
                      onMouseLeave={handleAchLeave}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAchLeave()
                        setSelectedAch(a)
                      }}
                      className={`rounded-lg overflow-hidden shrink-0 transition-transform duration-100 hover:scale-125 hover:z-10 relative cursor-pointer ${
                        isHardcore
                          ? 'ring-2 ring-yellow-400'
                          : isSoftcore
                            ? 'ring-2 ring-blue-400'
                            : ''
                      }`}
                    >
                      <Image
                        src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
                        alt={a.Title}
                        width={48}
                        height={48}
                        className={`w-12 h-12 object-cover ${earnedAny ? '' : 'grayscale opacity-40'}`}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAch && (
          <AchievementModal
            achievement={selectedAch}
            numDistinctPlayers={gameData?.NumDistinctPlayers ?? 1}
            onClose={() => setSelectedAch(null)}
            gameId={item.game_id}
            isFavorited={favoritedIds.has(selectedAch.ID)}
            onToggleFavorite={() => handleToggleFavorite(selectedAch)}
          />
        )}
      </AnimatePresence>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-bg-card border border-bg-header/80 rounded-xl shadow-2xl p-3 max-w-65"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <p className="text-sm font-semibold text-text-main">{tooltip.achievement.Title}</p>
          <p className="text-xs text-text-secondary mt-1 leading-snug">{tooltip.achievement.Description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-text-secondary">{tooltip.achievement.Points} pts</span>
            {tooltip.achievement.Type === 'progression' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300">Progression</span>
            )}
            {tooltip.achievement.Type === 'win_condition' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300">Win condition</span>
            )}
            {tooltip.achievement.Type === 'missable' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-900/60 text-red-300">Missable</span>
            )}
            {tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300">Hardcore</span>
            )}
            {tooltip.achievement.DateEarned && !tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300">Softcore</span>
            )}
            {!tooltip.achievement.DateEarned && !tooltip.achievement.DateEarnedHardcore && (
              <span className="text-xs text-text-secondary/60">{T.achievement.notEarned}</span>
            )}
          </div>
          {(tooltip.achievement.DateEarnedHardcore ?? tooltip.achievement.DateEarned) && (
            <p className="text-xs text-text-secondary/60 mt-1">
              {new Date((tooltip.achievement.DateEarnedHardcore ?? tooltip.achievement.DateEarned)!).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
const spotlightVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } },
}

function AddGameModal({
  isOpen,
  onClose,
  groupId,
  existingIds,
  onAdded,
}: {
  isOpen: boolean
  onClose: () => void
  groupId: number
  existingIds: Set<number>
  onAdded: (items: GameGroupItem[]) => void
}) {
  const { T } = useLanguage()
  const { all } = useGamesData()
  const recentlyPlayedData = useRecentlyPlayedGames()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Map<number, RetroAchievementsGameCompleted>>(new Map())
  const [saving, setSaving] = useState(false)
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const wantFetched = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setTimeout(() => inputRef.current?.focus(), 50)
    setQuery('')
    setSelected(new Map())
    if (!wantFetched.current) {
      wantFetched.current = true
      fetchWithRetry('/api/getWantPlayGames')
        .then((data) => {
          setWantToPlay((data as { Results?: WantToPlayGame[] })?.Results ?? [])
        })
        .catch(() => {})
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const uniqueGames = useMemo(() => {
    const seen = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of all) {
      if (!seen.has(g.GameID)) seen.set(g.GameID, g)
    }
    for (const g of wantToPlay) {
      if (!seen.has(g.ID)) {
        seen.set(g.ID, {
          GameID: g.ID,
          Title: g.Title,
          ImageIcon: g.ImageIcon,
          ConsoleID: g.ConsoleID,
          ConsoleName: g.ConsoleName,
          MaxPossible: g.AchievementsPublished,
          NumAwarded: 0,
          PctWon: '0',
          HardcoreMode: '0',
        })
      }
    }
    return Array.from(seen.values())
  }, [all, wantToPlay])

  const directGameId = useMemo(() => {
    const q = query.trim()
    if (/^\d{3,}$/.test(q)) return parseInt(q)
    const m = q.match(/retroachievements\.org\/game\/(\d+)/i)
    return m ? parseInt(m[1]) : null
  }, [query])

  const results = useMemo(() => {
    if (!query.trim() || directGameId) return []
    const q = query.toLowerCase()
    return uniqueGames
      .filter((g) => g.Title.toLowerCase().includes(q) && !existingIds.has(g.GameID))
      .map((g) => {
        const t = g.Title.toLowerCase()
        const score =
          t === q ? 3 : t.startsWith(q) ? 2 : t.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 0
        return { g, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ g }) => g)
  }, [query, uniqueGames, existingIds, directGameId])

  function toggleGame(g: RetroAchievementsGameCompleted) {
    setSelected((prev) => {
      const next = new Map(prev)
      next.has(g.GameID) ? next.delete(g.GameID) : next.set(g.GameID, g)
      return next
    })
  }

  async function addDirectById(id: number) {
    try {
      const data = await fetch(`/api/getGameData?gameId=${id}`).then((r) => r.json())
      if (data?.Title) {
        const g: RetroAchievementsGameCompleted = {
          GameID: id,
          Title: data.Title,
          ImageIcon: data.ImageIcon ?? '',
          ConsoleID: data.ConsoleID ?? 0,
          ConsoleName: data.ConsoleName ?? '',
          MaxPossible: data.NumAchievements ?? 0,
          NumAwarded: 0,
          PctWon: '0',
          HardcoreMode: '0',
        }
        setSelected((prev) => {
          const next = new Map(prev)
          next.has(id) ? next.delete(id) : next.set(id, g)
          return next
        })
        setQuery('')
      }
    } catch {
      /* ignore */
    }
  }

  async function handleConfirm() {
    if (selected.size === 0) return
    setSaving(true)
    const added: GameGroupItem[] = []
    for (const g of selected.values()) {
      try {
        const res = await fetch(`/api/groups/${groupId}/games`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game_id: g.GameID,
            title: g.Title,
            image_icon: g.ImageIcon,
            console_name: g.ConsoleName,
            pct_won: parseFloat(g.PctWon),
          }),
        })
        if (res.ok) added.push(await res.json())
      } catch {
        /* skip */
      }
    }
    setSaving(false)
    onAdded(added)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <motion.div
              className="bg-bg-card rounded-2xl shadow-2xl border border-white/5 flex flex-col overflow-hidden"
              variants={spotlightVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 shrink-0">
                <IconSearch className="w-5 h-5 text-text-secondary shrink-0" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T.groups.searchGames}
                  className="flex-1 bg-transparent text-text-main text-base outline-none placeholder:text-text-secondary"
                />
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-main transition-colors shrink-0"
                  aria-label="Close"
                >
                  <IconX className="w-4 h-4" aria-hidden />
                </button>
              </div>

              {(results.length > 0 || directGameId) && (
                <div className="max-h-80 overflow-y-auto">
                  {results.map((g) => {
                    const isSel = selected.has(g.GameID)
                    return (
                      <button
                        key={g.GameID}
                        onClick={() => toggleGame(g)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isSel ? 'bg-accent/10' : 'hover:bg-bg-main'}`}
                      >
                        {g.ImageIcon && (
                          <Image
                            src={`https://retroachievements.org${g.ImageIcon}`}
                            alt={g.Title}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded object-cover shrink-0"
                            unoptimized
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-main truncate">{g.Title}</p>
                          <p className="text-xs text-text-secondary truncate">{g.ConsoleName}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSel ? 'bg-accent border-accent' : 'border-white/20'}`}
                        >
                          {isSel && <IconCheck className="w-3 h-3 text-bg-main" aria-hidden />}
                        </div>
                      </button>
                    )
                  })}
                  {directGameId && !existingIds.has(directGameId) && (
                    <button
                      onClick={() => addDirectById(directGameId)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-t border-white/5 ${selected.has(directGameId) ? 'bg-accent/10' : 'hover:bg-bg-main'}`}
                    >
                      <div className="w-8 h-8 rounded bg-bg-main flex items-center justify-center shrink-0 text-xs font-bold text-text-secondary">
                        ID
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main">
                          {T.search.openById} #{directGameId}
                        </p>
                        <p className="text-xs text-text-secondary">Game ID</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selected.has(directGameId) ? 'bg-accent border-accent' : 'border-white/20'}`}
                      >
                        {selected.has(directGameId) && (
                          <IconCheck className="w-3 h-3 text-bg-main" aria-hidden />
                        )}
                      </div>
                    </button>
                  )}
                </div>
              )}

              {selected.size > 0 && (
                <div className="border-t border-white/5 px-4 py-3 flex flex-col gap-3 shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selected.values()).map((g) => (
                      <span
                        key={g.GameID}
                        className="flex items-center gap-1.5 bg-accent/15 text-accent text-xs px-2.5 py-1 rounded-full"
                      >
                        {g.ImageIcon && (
                          <Image
                            src={`https://retroachievements.org${g.ImageIcon}`}
                            alt={g.Title}
                            width={14}
                            height={14}
                            className="rounded shrink-0"
                            unoptimized
                          />
                        )}
                        <span className="truncate max-w-32">{g.Title}</span>
                        <button
                          onClick={() => toggleGame(g)}
                          className="text-accent/60 hover:text-accent transition-colors ml-0.5"
                          aria-label={`Remove ${g.Title}`}
                        >
                          <IconX className="w-3 h-3" aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? '…' : `${T.groups.addGame} (${selected.size})`}
                  </button>
                </div>
              )}

              {!query.trim() && selected.size === 0 && (
                <p className="text-text-secondary text-xs text-center py-6">
                  {T.groups.searchGames}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function GroupDetailPage() {
  const { id } = useParams()
  const groupId = parseInt(id as string)
  const router = useRouter()
  const { T } = useLanguage()
  const { updateGroup, deleteGroup } = useGroups()
  const { all: allGames } = useGamesData()
  const recentlyPlayed = useRecentlyPlayedGames()

  const achievementMap = useMemo(() => {
    const map = new Map<number, { earned: number; total: number }>()
    // recentlyPlayed as base — has NumAchieved + NumPossibleAchievements for any played game
    for (const g of recentlyPlayed)
      map.set(g.GameID, {
        earned: g.NumAchievedHardcore || g.NumAchieved,
        total: g.NumPossibleAchievements,
      })
    // allGames overrides when earned count is higher (completed-games list is authoritative)
    for (const g of allGames) {
      const existing = map.get(g.GameID)
      if (!existing || g.NumAwarded > existing.earned)
        map.set(g.GameID, { earned: g.NumAwarded, total: g.MaxPossible })
    }
    return map
  }, [allGames, recentlyPlayed])

  const pointsMap = useMemo(() => {
    const map = new Map<number, { earned: number; total: number }>()
    for (const g of recentlyPlayed)
      map.set(g.GameID, {
        earned: g.ScoreAchievedHardcore || g.ScoreAchieved,
        total: g.PossibleScore,
      })
    return map
  }, [recentlyPlayed])

  const lastPlayedMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const g of recentlyPlayed) map.set(g.GameID, g.LastPlayed)
    return map
  }, [recentlyPlayed])

  const [group, setGroup] = useState<(GameGroup & { items: GameGroupItem[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [addGameOpen, setAddGameOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedConsoles, setSelectedConsoles] = useState<Set<string>>(new Set())
  const [pctFilter, setPctFilter] = useState<PctFilter>('all')
  const [decadeFilter, setDecadeFilter] = useState<DecadeFilter>('all')
  const [releaseYears, setReleaseYears] = useState<Map<number, number>>(new Map())
  const fetchedIdsRef = useRef<Set<number>>(new Set())
  const saveOrderTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`)
      if (!res.ok) {
        router.push('/groups')
        return
      }
      setGroup(await res.json())
    } catch {
      router.push('/groups')
    } finally {
      setLoading(false)
    }
  }, [groupId, router])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  const fetchReleaseYears = useCallback(async (items: GameGroupItem[]) => {
    const toFetch = items.filter((i) => !fetchedIdsRef.current.has(i.game_id))
    if (!toFetch.length) return
    toFetch.forEach((i) => fetchedIdsRef.current.add(i.game_id))
    const results = await Promise.all(
      toFetch.map((item) =>
        fetch(`/api/getGameData?gameId=${item.game_id}`)
          .then((r) => r.json())
          .then((d: { Released?: string | null }) => ({
            id: item.game_id,
            year: d.Released ? parseInt(d.Released.substring(0, 4)) : null,
          }))
          .catch(() => ({ id: item.game_id, year: null as number | null }))
      )
    )
    setReleaseYears((prev) => {
      const next = new Map(prev)
      for (const r of results) {
        if (r.year && !isNaN(r.year)) next.set(r.id, r.year)
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (group?.items.length) fetchReleaseYears(group.items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, fetchReleaseYears])

  type SyncItem = {
    game_id: number
    num_awarded: number
    max_possible: number
    points_won: number
    max_points: number
  }

  const rpSyncedRef = useRef<number | null>(null)
  const fetchSyncedRef = useRef<number | null>(null)

  // Sync ach + pts counts from recentlyPlayed into DB
  useEffect(() => {
    if (!group || !recentlyPlayed.length || rpSyncedRef.current === group.id) return
    rpSyncedRef.current = group.id
    const updates: SyncItem[] = group.items.flatMap((item) => {
      const rp = recentlyPlayed.find((g) => g.GameID === item.game_id)
      if (!rp) return []
      return [
        {
          game_id: item.game_id,
          num_awarded: rp.NumAchievedHardcore || rp.NumAchieved,
          max_possible: rp.NumPossibleAchievements || item.max_possible,
          points_won: rp.ScoreAchievedHardcore || rp.ScoreAchieved,
          max_points: rp.PossibleScore,
        },
      ]
    })
    if (!updates.length) return
    setGroup((g) =>
      g
        ? {
            ...g,
            items: g.items.map((item) => {
              const u = updates.find((u) => u.game_id === item.game_id)
              return u ? { ...item, ...u } : item
            }),
          }
        : g
    )
    fetch(`/api/groups/${groupId}/games`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {})
  }, [group, recentlyPlayed, groupId])

  // Background fetch game progression for items with no ach data anywhere
  useEffect(() => {
    if (!group || fetchSyncedRef.current === group.id) return
    const missing = group.items.filter((item) => item.max_possible === 0)
    fetchSyncedRef.current = group.id
    if (!missing.length) return
    Promise.allSettled(
      missing.slice(0, 20).map(async (item): Promise<SyncItem | null> => {
        const data = await fetch(`/api/getGameProgression?gameId=${item.game_id}`).then((r) =>
          r.json()
        )
        const achs = Object.values(
          (data.Achievements ?? {}) as Record<string, RetroAchievement | undefined>
        ).filter((a): a is RetroAchievement => !!a)
        if (!achs.length) return null
        const earned = achs.filter((a) => a.DateEarnedHardcore || a.DateEarned)
        return {
          game_id: item.game_id,
          num_awarded: earned.length,
          max_possible: achs.length,
          points_won: earned.reduce((s, a) => s + (a.Points ?? 0), 0),
          max_points: achs.reduce((s, a) => s + (a.Points ?? 0), 0),
        }
      })
    ).then((results) => {
      const ok: SyncItem[] = results
        .filter(
          (r): r is PromiseFulfilledResult<SyncItem> => r.status === 'fulfilled' && r.value !== null
        )
        .map((r) => r.value)
      if (!ok.length) return
      setGroup((g) =>
        g
          ? {
              ...g,
              items: g.items.map((item) => {
                const u = ok.find((u) => u.game_id === item.game_id)
                return u ? { ...item, ...u } : item
              }),
            }
          : g
      )
      fetch(`/api/groups/${groupId}/games`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ok),
      }).catch(() => {})
    })
  }, [group, recentlyPlayed, groupId])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !group) return
    const oldIndex = group.items.findIndex((i) => i.id === active.id)
    const newIndex = group.items.findIndex((i) => i.id === over.id)
    const newItems = arrayMove(group.items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      position: idx,
    }))
    setGroup({ ...group, items: newItems })
    clearTimeout(saveOrderTimer.current)
    saveOrderTimer.current = setTimeout(() => {
      fetch(`/api/groups/${groupId}/games`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newItems.map((i) => i.id) }),
      })
    }, 600)
  }

  async function handleRemoveGame(itemId: number) {
    if (!group) return
    const item = group.items.find((i) => i.id === itemId)
    if (!item) return
    await fetch(`/api/groups/${groupId}/games?gameId=${item.game_id}`, { method: 'DELETE' })
    setGroup({ ...group, items: group.items.filter((i) => i.id !== itemId) })
  }

  async function handleEdit(data: {
    title: string
    description: string
    icon: string
    is_public: boolean
  }) {
    const updated = await updateGroup(groupId, {
      title: data.title,
      description: data.description || undefined,
      icon: data.icon || undefined,
      is_public: data.is_public,
    })
    if (group) setGroup({ ...group, ...updated })
  }

  async function handleDelete() {
    await deleteGroup(groupId)
    router.push('/groups')
  }

  const existingIds = useMemo(() => new Set((group?.items ?? []).map((i) => i.game_id)), [group])

  const consolePills = useMemo(() => {
    if (!group) return []
    const seen = new Map<string, { name: string; icon?: string }>()
    for (const item of group.items) {
      if (item.console_name && !seen.has(item.console_name)) {
        const cons = CONSOLES.find((c) => c.name === item.console_name)
        seen.set(item.console_name, { name: item.console_name, icon: cons?.icon })
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [group])

  const filtersActive = pctFilter !== 'all' || decadeFilter !== 'all' || selectedConsoles.size > 0

  const filteredItems = useMemo(() => {
    if (!group) return []
    return group.items.filter((item) => {
      if (
        selectedConsoles.size > 0 &&
        (!item.console_name || !selectedConsoles.has(item.console_name))
      )
        return false
      const pct = parseFloat(item.pct_won)
      if (pctFilter === '0' && pct !== 0) return false
      if (pctFilter === 'progress' && !(pct > 0 && pct < 1)) return false
      if (pctFilter === '100' && pct < 1) return false
      if (decadeFilter !== 'all') {
        const year = releaseYears.get(item.game_id)
        if (!year || getDecade(year) !== decadeFilter) return false
      }
      return true
    })
  }, [group, selectedConsoles, pctFilter, decadeFilter, releaseYears])

  const hasYearsData = releaseYears.size > 0

  function toggleConsole(name: string) {
    setSelectedConsoles((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4">
        <div className="w-full lg:max-w-[98%] flex flex-col gap-3 animate-pulse">
          <div className="h-6 w-24 rounded bg-white/10" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-6 w-48 rounded bg-white/10" />
              <div className="h-3 w-32 rounded bg-white/10" />
            </div>
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    )
  }

  if (!group) return null

  return (
    <motion.div
      className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-white"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full lg:max-w-[98%] flex flex-col gap-3">
        {/* Back */}
        <Link
          href="/groups"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-main transition-colors w-fit"
        >
          <IconArrowLeft className="w-4 h-4" aria-hidden />
          {T.groups.title}
        </Link>

        {/* Group header */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-xl bg-bg-card flex items-center justify-center shrink-0 overflow-hidden">
            <GroupIconDisplay icon={group.icon} />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-text-main">{group.title}</h1>
              {group.is_public ? (
                <span className="flex items-center gap-1 text-[10px] text-accent/70 uppercase tracking-widest">
                  <IconWorld className="w-3 h-3" aria-hidden /> public
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-text-secondary/60 uppercase tracking-widest">
                  <IconLock className="w-3 h-3" aria-hidden /> private
                </span>
              )}
            </div>
            {group.description && (
              <p className="text-sm text-text-secondary">{group.description}</p>
            )}
            <p className="text-xs text-text-secondary">
              {group.items.length} {T.groups.games}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setAddGameOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-main text-xs font-medium hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/70"
            >
              <IconPlus className="w-3.5 h-3.5" aria-hidden />
              {T.groups.addGame}
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="p-2 rounded-lg hover:bg-bg-card transition-colors text-text-secondary hover:text-text-main focus:outline-none focus:ring-2 focus:ring-accent/70"
              aria-label={T.groups.editGroup}
            >
              <IconEdit className="w-4 h-4" aria-hidden />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-text-secondary hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/70"
              aria-label={T.groups.deleteGroup}
            >
              <IconTrash className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Console filter */}
        {consolePills.length > 1 && (
          <div className="flex flex-wrap gap-1.5 py-1">
            {consolePills.map((c) => (
              <button
                key={c.name}
                onClick={() => toggleConsole(c.name)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedConsoles.has(c.name)
                    ? 'bg-accent text-bg-main'
                    : 'bg-bg-card text-text-secondary hover:text-text-main'
                }`}
              >
                {c.icon && (
                  <Image
                    src={c.icon}
                    alt={c.name}
                    width={14}
                    height={14}
                    className="object-contain shrink-0"
                  />
                )}
                {c.name}
              </button>
            ))}
            {selectedConsoles.size > 0 && (
              <button
                onClick={() => setSelectedConsoles(new Set())}
                className="px-2.5 py-1 rounded-lg text-xs text-text-secondary/60 hover:text-text-secondary transition-colors cursor-pointer"
              >
                ✕ {T.groups.clearFilters}
              </button>
            )}
          </div>
        )}

        {/* Completion + decade filters */}
        {group.items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { value: 'all', label: T.groups.filterAll },
                  { value: '0', label: T.groups.filter0 },
                  { value: 'progress', label: T.groups.filterProgress },
                  { value: '100', label: T.groups.filter100 },
                ] as { value: PctFilter; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPctFilter(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    pctFilter === opt.value
                      ? 'bg-accent text-bg-main'
                      : 'bg-bg-card text-text-secondary hover:text-text-main'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {hasYearsData && (
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { value: 'all', label: T.groups.filterAll },
                    { value: '80s', label: "80's" },
                    { value: '90s', label: "90's" },
                    { value: '00s', label: "00's" },
                    { value: '10s', label: "10's" },
                    { value: '20s', label: "20's" },
                  ] as { value: DecadeFilter; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDecadeFilter(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      decadeFilter === opt.value
                        ? 'bg-accent text-bg-main'
                        : 'bg-bg-card text-text-secondary hover:text-text-main'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Games */}
        {group.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <p className="text-sm text-text-secondary">{T.groups.noGames}</p>
            <button
              onClick={() => setAddGameOpen(true)}
              className="px-4 py-2 rounded-xl bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              {T.groups.addGame}
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <p className="text-sm text-text-secondary">{T.groups.noGamesFilter}</p>
            <button
              onClick={() => {
                setPctFilter('all')
                setDecadeFilter('all')
                setSelectedConsoles(new Set())
              }}
              className="text-xs text-accent hover:underline"
            >
              {T.groups.clearFilters}
            </button>
          </div>
        ) : filtersActive ? (
          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onRemove={handleRemoveGame}
                draggable={false}
                achStats={achievementMap.get(item.game_id)}
                ptsStats={pointsMap.get(item.game_id)}
                lastPlayed={lastPlayedMap.get(item.game_id)}
              />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={group.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveGame}
                    draggable={true}
                    achStats={achievementMap.get(item.game_id)}
                    ptsStats={pointsMap.get(item.game_id)}
                    lastPlayed={lastPlayedMap.get(item.game_id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add game spotlight */}
      <AddGameModal
        isOpen={addGameOpen}
        onClose={() => setAddGameOpen(false)}
        groupId={groupId}
        existingIds={existingIds}
        onAdded={(items) => {
          setGroup((g) => (g ? { ...g, items: [...g.items, ...items] } : g))
          fetchReleaseYears(items)
        }}
      />

      {/* Edit modal */}
      <GroupModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        group={group}
        onSave={handleEdit}
      />

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="bg-bg-card rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-text-main">{T.groups.confirmDelete}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-bg-main text-text-secondary text-sm hover:text-text-main transition-colors"
              >
                {T.groups.cancel}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                {T.groups.deleteGroup}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
