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
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPlus,
  IconLock,
  IconWorld,
} from '@tabler/icons-react'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { useGroups } from '@/hooks/useGroups'
import { useGamesData } from '@/context/GamesDataContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { GameGroup, GameGroupItem, RetroAchievement } from '@/types/types'
import GroupModal from '@/components/groups/GroupModal'
import GroupIconDisplay from '@/components/groups/group-icon-display/GroupIconDisplay'
import SortableItem from '@/components/groups/sortable-item/SortableItem'
import AddGameModal from '@/components/groups/add-game-modal/AddGameModal'
import DeleteConfirmDialog from '@/components/groups/delete-confirm-dialog/DeleteConfirmDialog'
import StatusGridControl, { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import { CONSOLES } from '@/constants'

type PctFilter = 'all' | '0' | 'progress' | '100'
type DecadeFilter = 'all' | '80s' | '90s' | '00s' | '10s' | '20s'

const GRID_COLS_CLASS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}

function getDecade(year: number): DecadeFilter {
  if (year < 1990) return '80s'
  if (year < 2000) return '90s'
  if (year < 2010) return '00s'
  if (year < 2020) return '10s'
  return '20s'
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
    const hcEarnedMap = new Map<number, number>()
    const scEarnedMap = new Map<number, number>()
    const totalMap = new Map<number, number>()

    for (const g of recentlyPlayed) {
      totalMap.set(g.GameID, g.NumPossibleAchievements)
      if (g.NumAchievedHardcore > (hcEarnedMap.get(g.GameID) ?? 0))
        hcEarnedMap.set(g.GameID, g.NumAchievedHardcore)
      if (g.NumAchieved > (scEarnedMap.get(g.GameID) ?? 0))
        scEarnedMap.set(g.GameID, g.NumAchieved)
    }

    for (const g of allGames) {
      if (!totalMap.has(g.GameID) || g.MaxPossible > (totalMap.get(g.GameID) ?? 0))
        totalMap.set(g.GameID, g.MaxPossible)
      if (Number(g.HardcoreMode) === 1) {
        if (g.NumAwarded > (hcEarnedMap.get(g.GameID) ?? 0))
          hcEarnedMap.set(g.GameID, g.NumAwarded)
      } else {
        if (g.NumAwarded > (scEarnedMap.get(g.GameID) ?? 0))
          scEarnedMap.set(g.GameID, g.NumAwarded)
      }
    }

    const map = new Map<number, { scEarned: number; hcEarned: number; total: number }>()
    const allIds = new Set([...hcEarnedMap.keys(), ...scEarnedMap.keys()])
    for (const id of allIds) {
      map.set(id, {
        scEarned: scEarnedMap.get(id) ?? 0,
        hcEarned: hcEarnedMap.get(id) ?? 0,
        total: totalMap.get(id) ?? 0,
      })
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
  const [gridCols, setGridCols] = useState<StatusGridCols>(1)
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
    const seen = new Map<string, { name: string; icon?: string; color?: string }>()
    for (const item of group.items) {
      if (item.console_name && !seen.has(item.console_name)) {
        const cons = CONSOLES.find((c) => c.name === item.console_name)
        seen.set(item.console_name, { name: item.console_name, icon: cons?.icon, color: cons?.color })
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
          <div className="flex items-center gap-2 shrink-0">
            {group.items.length > 0 && <StatusGridControl cols={gridCols} onChange={setGridCols} />}
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
                    ? (c.color ?? 'bg-accent text-bg-main')
                    : 'bg-bg-main text-text-secondary hover:text-text-main'
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
          <div className={`grid gap-3 ${GRID_COLS_CLASS[gridCols]}`}>
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
              strategy={rectSortingStrategy}
            >
              <div className={`grid gap-3 ${GRID_COLS_CLASS[gridCols]}`}>
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
      <DeleteConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </motion.div>
  )
}
