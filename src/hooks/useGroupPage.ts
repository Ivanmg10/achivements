'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { isRa } from '@/utils/groupItems'
import { mapLimit } from '@/utils/utils'
import type { GameGroup, GameGroupItem, RecentlyPlayedGame, RetroAchievement } from '@/types/types'

export type GroupWithItems = GameGroup & { items: GameGroupItem[] }
export type GroupStatus = 'loading' | 'ready' | 'missing' | 'error'
export type GroupEdit = { title: string; description: string; icon: string; is_public: boolean }

type SyncItem = { source: 'ra'; game_id: number; num_awarded: number; max_possible: number; points_won: number; max_points: number }

/** Progress lookups at a time for games with no counts: RA turns away bursts. */
const PROGRESS_CONCURRENCY = 4
const PROGRESS_MAX = 20
const SAVE_ORDER_DELAY = 600

function mergeCounts(items: GameGroupItem[], updates: SyncItem[]): GameGroupItem[] {
  return items.map((item) => {
    const u = isRa(item) ? updates.find((x) => x.game_id === item.game_id) : undefined
    return u ? { ...item, ...u } : item
  })
}

function saveCounts(groupId: number, updates: SyncItem[]) {
  fetch(`/api/groups/${groupId}/games`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
    .then((r) => {
      if (!r.ok) throw new Error(`sync ${r.status}`)
    })
    // Only the cached counts; the page already shows the fresh ones.
    .catch((err) => console.error('[useGroupPage] sync counts', err))
}

/**
 * One group and everything done to it on its page: loading (with a state for
 * a group that is gone or not yours, and one for a failure that can be
 * retried), release years for the decade filter (looked up once, on the
 * server), keeping the stored achievement counts fresh, reordering, removing a
 * game (with undo), editing and deleting the group.
 */
export function useGroupPage(groupId: number, recentlyPlayed: RecentlyPlayedGame[]) {
  const { T } = useLanguage()
  const [group, setGroup] = useState<GroupWithItems | null>(null)
  const [status, setStatus] = useState<GroupStatus>('loading')
  const hasFetched = useRef(false)
  const yearsAsked = useRef(false)
  const rpSynced = useRef<number | null>(null)
  const progressSynced = useRef<number | null>(null)
  const saveOrderTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fillYears = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/years`, { method: 'POST' })
      if (!res.ok) throw new Error(`years ${res.status}`)
      const { years } = (await res.json()) as { years: { id: number; release_year: number }[] }
      if (!years.length) return
      const byId = new Map(years.map((y) => [y.id, y.release_year]))
      setGroup((g) => (g ? { ...g, items: g.items.map((i) => (byId.has(i.id) ? { ...i, release_year: byId.get(i.id) } : i)) } : g))
    } catch (err) {
      // Only costs the decade filter these games for now; the next visit asks again.
      console.error('[useGroupPage] release years', err)
    }
  }, [groupId])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/groups/${groupId}`)
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        setStatus('missing')
        return
      }
      if (!res.ok) throw new Error(`group ${res.status}`)
      const data = (await res.json()) as GroupWithItems
      setGroup(data)
      setStatus('ready')
      if (!yearsAsked.current && data.items.some((i) => i.release_year == null)) {
        yearsAsked.current = true
        fillYears()
      }
    } catch (err) {
      console.error('[useGroupPage] load', err)
      setStatus('error')
    }
  }, [groupId, fillYears])

  useEffect(() => {
    if (hasFetched.current || !Number.isInteger(groupId)) return
    hasFetched.current = true
    load()
  }, [groupId, load])

  useEffect(() => () => clearTimeout(saveOrderTimer.current), [])

  // Counts from the recently played feed into the stored copy, once per visit.
  useEffect(() => {
    if (!group || !recentlyPlayed.length || rpSynced.current === group.id) return
    rpSynced.current = group.id
    const updates: SyncItem[] = group.items.filter(isRa).flatMap((item) => {
      const rp = recentlyPlayed.find((g) => g.GameID === item.game_id)
      if (!rp) return []
      return [{
        source: 'ra' as const,
        game_id: item.game_id,
        num_awarded: rp.NumAchievedHardcore || rp.NumAchieved,
        max_possible: rp.NumPossibleAchievements || item.max_possible,
        points_won: rp.ScoreAchievedHardcore || rp.ScoreAchieved,
        max_points: rp.PossibleScore,
      }]
    })
    // The page already reads these numbers live (raProgressMaps); only the
    // stored copy, used by the groups list, needs them.
    if (updates.length) saveCounts(groupId, updates)
  }, [group, recentlyPlayed, groupId])

  // Games with no counts anywhere: ask RA, a few at a time.
  useEffect(() => {
    if (!group || progressSynced.current === group.id) return
    progressSynced.current = group.id
    const missing = group.items.filter((item) => isRa(item) && item.max_possible === 0).slice(0, PROGRESS_MAX)
    if (!missing.length) return
    mapLimit(missing, PROGRESS_CONCURRENCY, async (item): Promise<SyncItem | null> => {
      const res = await fetch(`/api/getGameProgression?gameId=${item.game_id}`)
      if (!res.ok) throw new Error(`getGameProgression ${res.status}`)
      const data = await res.json()
      const achs = Object.values((data.Achievements ?? {}) as Record<string, RetroAchievement | undefined>).filter(
        (a): a is RetroAchievement => !!a,
      )
      if (!achs.length) return null
      const earned = achs.filter((a) => a.DateEarnedHardcore || a.DateEarned)
      return {
        source: 'ra',
        game_id: item.game_id,
        num_awarded: earned.length,
        max_possible: achs.length,
        points_won: earned.reduce((s, a) => s + (a.Points ?? 0), 0),
        max_points: achs.reduce((s, a) => s + (a.Points ?? 0), 0),
      }
    }).then((results) => {
      const ok = results.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []))
      if (!ok.length) return
      setGroup((g) => (g ? { ...g, items: mergeCounts(g.items, ok) } : g))
      saveCounts(groupId, ok)
    })
  }, [group, groupId])

  const saveOrder = useCallback(
    (items: GameGroupItem[]) => {
      clearTimeout(saveOrderTimer.current)
      saveOrderTimer.current = setTimeout(() => {
        fetch(`/api/groups/${groupId}/games`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: items.map((i) => i.id) }),
        })
          .then((r) => {
            if (!r.ok) throw new Error(`reorder ${r.status}`)
          })
          .catch((err) => {
            // Not saved: reload so the list shows the order that actually stuck.
            console.error('[useGroupPage] reorder', err)
            notify.error(T.toast.orderFailed)
            load()
          })
      }, SAVE_ORDER_DELAY)
    },
    [groupId, load, T],
  )

  const reorder = useCallback(
    (activeId: number, overId: number) => {
      if (!group) return
      const from = group.items.findIndex((i) => i.id === activeId)
      const to = group.items.findIndex((i) => i.id === overId)
      if (from < 0 || to < 0) return
      const items = arrayMove(group.items, from, to).map((item, idx) => ({ ...item, position: idx }))
      setGroup({ ...group, items })
      saveOrder(items)
    },
    [group, saveOrder],
  )

  /** Puts a removed game back where it was: added again, then the old order restored. */
  const restore = useCallback(
    async (removed: GameGroupItem, orderBefore: number[]) => {
      try {
        const res = await fetch(`/api/groups/${groupId}/games`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: removed.source ?? 'ra',
            game_id: removed.game_id,
            title: removed.title,
            image_icon: removed.image_icon,
            console_name: removed.console_name,
            pct_won: Number(removed.pct_won) || 0,
            num_awarded: removed.num_awarded,
            max_possible: removed.max_possible,
            points_won: removed.points_won,
            max_points: removed.max_points,
          }),
        })
        if (!res.ok) throw new Error(`restore ${res.status}`)
        const added = (await res.json()) as GameGroupItem
        const back = { ...removed, ...added, release_year: removed.release_year }
        let restoredItems: GameGroupItem[] = []
        setGroup((g) => {
          if (!g) return g
          const byId = new Map([...g.items, back].map((i) => [i.id, i]))
          restoredItems = orderBefore.map((id) => byId.get(id === removed.id ? back.id : id)).filter((i): i is GameGroupItem => !!i)
          return { ...g, items: restoredItems }
        })
        saveOrder(restoredItems)
        notify.success(T.toast.gameRestored)
      } catch (err) {
        console.error('[useGroupPage] restore', err)
        notify.error(T.toast.gameRestoreFailed)
      }
    },
    [groupId, saveOrder, T],
  )

  const removeGame = useCallback(
    async (itemId: number) => {
      const item = group?.items.find((i) => i.id === itemId)
      if (!group || !item) return
      const orderBefore = group.items.map((i) => i.id)
      try {
        const res = await fetch(`/api/groups/${groupId}/games?gameId=${item.game_id}&source=${item.source ?? 'ra'}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`remove ${res.status}`)
        setGroup((g) => (g ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g))
        notify.success(T.toast.gameRemoved, { action: { label: T.toast.undo, onClick: () => restore(item, orderBefore) } })
      } catch (err) {
        console.error('[useGroupPage] remove', err)
        notify.error(T.toast.gameRemoveFailed)
      }
    },
    [group, groupId, restore, T],
  )

  const addItems = useCallback(
    (items: GameGroupItem[]) => {
      setGroup((g) => (g ? { ...g, items: [...g.items, ...items] } : g))
      if (items.some((i) => i.release_year == null)) fillYears()
    },
    [fillYears],
  )

  /** Throws when not saved, so the modal can say so next to the form. */
  const edit = useCallback(
    async (data: GroupEdit) => {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          icon: data.icon || undefined,
          is_public: data.is_public,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Error')
      }
      const updated = (await res.json()) as GameGroup
      setGroup((g) => (g ? { ...g, ...updated } : g))
      notify.success(T.toast.groupSaved)
    },
    [groupId, T],
  )

  /** True when the group is gone, so the page can leave. */
  const remove = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`delete ${res.status}`)
      notify.success(T.toast.groupDeleted)
      return true
    } catch (err) {
      console.error('[useGroupPage] delete', err)
      notify.error(T.toast.groupDeleteFailed)
      return false
    }
  }, [groupId, T])

  return { group, status, retry: load, reorder, removeGame, addItems, edit, remove }
}
