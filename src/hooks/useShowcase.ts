import { useCallback, useMemo, useRef } from 'react'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { notify } from '@/lib/notify'
import { withSubject } from '@/utils/withSubject'
import { SHOWCASE_MAX, showcaseKey, type ShowcaseEntry, type ShowcaseItem } from '@/utils/showcase'
import { useHiddenGames } from '@/context/HiddenGamesContext'

/**
 * The achievement showcase: up to five earned achievements, in the user's order.
 * The user's own (to add, take out and reorder), or on someone's public profile
 * theirs, to read. Every change is optimistic and goes back, saying so, if it
 * cannot be saved; adding to a full showcase says it is full instead.
 * Nothing is asked until `enabled` (ShowcaseProvider waits for a reader).
 */
const NONE: ShowcaseItem[] = []
// A shared answer is shared by reference: copied before it is kept.
const copied = (data: unknown) => (Array.isArray(data) ? [...(data as ShowcaseItem[])] : NONE)

export function useShowcase(enabled = true) {
  const { T } = useLanguage()
  const subject = useSubject()
  const { isHidden, isLoading: hiddenLoading } = useHiddenGames()
  const read = useRetryingRead(enabled ? withSubject('/api/showcase', subject) : null, { parse: copied })
  const items = read.data ?? NONE
  const { setData: setItems, refetch: retry } = read
  const tempId = useRef(-1)

  const has = useCallback((e: Pick<ShowcaseEntry, 'source' | 'gameId' | 'achievementKey'>) => items.some((i) => showcaseKey(i) === showcaseKey(e)), [items])

  /**
   * Adds several at once (the picker's selection), in the order given and only as
   * many as fit; each is saved in turn, and one message says how it went.
   */
  const addMany = useCallback(
    async (entries: ShowcaseEntry[]) => {
      const fresh = entries.filter((e, i) => !items.some((it) => showcaseKey(it) === showcaseKey(e)) && entries.findIndex((x) => showcaseKey(x) === showcaseKey(e)) === i)
      if (fresh.length === 0) return
      if (items.length >= SHOWCASE_MAX) {
        notify.error(T.toast.showcaseFull)
        return
      }
      const temps: ShowcaseItem[] = fresh.slice(0, SHOWCASE_MAX - items.length).map((e) => ({ ...e, id: tempId.current-- }))
      setItems((prev) => [...(prev ?? NONE), ...temps])
      let full = false
      let failed = false
      for (const temp of temps) {
        const { id: tempKey, ...entry } = temp
        try {
          const res = await fetch('/api/showcase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry),
          })
          if (res.status === 409) {
            full = true
            setItems((prev) => (prev ?? NONE).filter((i) => i.id !== tempKey))
            continue
          }
          if (!res.ok) throw new Error(`Failed to add to the showcase (${res.status})`)
          const saved = (await res.json()) as ShowcaseItem
          setItems((prev) => (prev ?? NONE).map((i) => (i.id === tempKey ? saved : i)))
        } catch (err) {
          console.error('[useShowcase] add', err)
          failed = true
          setItems((prev) => (prev ?? NONE).filter((i) => i.id !== tempKey))
        }
      }
      if (full) notify.error(T.toast.showcaseFull)
      else if (failed) notify.error(T.toast.showcaseFailed)
      else notify.success(T.toast.showcaseUpdated)
    },
    [items, T, setItems],
  )

  const add = useCallback((entry: ShowcaseEntry) => addMany([entry]), [addMany])

  const remove = useCallback(
    async (item: ShowcaseItem) => {
      const before = items
      setItems((prev) => (prev ?? NONE).filter((i) => i.id !== item.id))
      try {
        const res = await fetch(`/api/showcase?id=${item.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`Failed to take out of the showcase (${res.status})`)
        notify.success(T.toast.showcaseUpdated)
      } catch (err) {
        console.error('[useShowcase] remove', err)
        setItems(before)
        notify.error(T.toast.showcaseFailed)
      }
    },
    [items, T, setItems],
  )

  const reorder = useCallback(
    async (next: ShowcaseItem[]) => {
      const before = items
      setItems(next)
      try {
        const res = await fetch('/api/showcase', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: next.map((i) => i.id).filter((id) => id > 0) }),
        })
        if (!res.ok) throw new Error(`Failed to save the showcase order (${res.status})`)
      } catch (err) {
        console.error('[useShowcase] reorder', err)
        setItems(before)
        notify.error(T.toast.orderFailed)
      }
    },
    [items, T, setItems],
  )

  const visible = useMemo(() => hiddenLoading ? [] : items.filter((item) => !isHidden(item.gameId, item.source)), [items, isHidden, hiddenLoading])
  return { items: visible, isLoading: hiddenLoading || !enabled || read.isLoading, error: read.error, retry, has, add, addMany, remove, reorder, full: items.length >= SHOWCASE_MAX }
}
