import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { notify } from '@/lib/notify'
import { withSubject } from '@/utils/withSubject'
import { SHOWCASE_MAX, showcaseKey, type ShowcaseEntry, type ShowcaseItem } from '@/utils/showcase'

/**
 * The achievement showcase: up to five earned achievements, in the user's order.
 * The user's own (to add, take out and reorder), or on someone's public profile
 * theirs, to read. Every change is optimistic and goes back, saying so, if it
 * cannot be saved; adding to a full showcase says it is full instead.
 */
export function useShowcase() {
  const { T } = useLanguage()
  const subject = useSubject()
  const [items, setItems] = useState<ShowcaseItem[]>([])
  /** Which load the answer (data or final failure) belongs to; loading is any other being asked for. */
  const [loadedKey, setLoadedKey] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const attemptRef = useRef(0)
  const tempId = useRef(-1)

  useEffect(() => {
    let current = true
    const retryTimer: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined }
    attemptRef.current = 0

    function load() {
      fetchWithRetry(withSubject('/api/showcase', subject))
        .then((data) => {
          if (!current) return
          // A shared answer is shared by reference: copied before it is kept.
          setItems(Array.isArray(data) ? [...(data as ShowcaseItem[])] : [])
          setFailed(false)
          setLoadedKey(reloadKey)
        })
        .catch((err) => {
          if (!current) return
          console.error('[useShowcase]', err)
          if (!scheduleRetry(attemptRef, retryTimer, load, err)) {
            setFailed(true)
            setLoadedKey(reloadKey)
          }
        })
    }

    load()
    return () => {
      current = false
      clearTimeout(retryTimer.current)
    }
  }, [reloadKey, subject])

  const retry = useCallback(() => {
    setFailed(false)
    setReloadKey((k) => k + 1)
  }, [])

  const has = useCallback((e: Pick<ShowcaseEntry, 'source' | 'gameId' | 'achievementKey'>) => items.some((i) => showcaseKey(i) === showcaseKey(e)), [items])

  const add = useCallback(
    async (entry: ShowcaseEntry) => {
      if (items.some((i) => showcaseKey(i) === showcaseKey(entry))) return
      if (items.length >= SHOWCASE_MAX) {
        notify.error(T.toast.showcaseFull)
        return
      }
      const temp: ShowcaseItem = { ...entry, id: tempId.current-- }
      setItems((prev) => [...prev, temp])
      try {
        const res = await fetch('/api/showcase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
        if (res.status === 409) {
          setItems((prev) => prev.filter((i) => i.id !== temp.id))
          notify.error(T.toast.showcaseFull)
          return
        }
        if (!res.ok) throw new Error(`Failed to add to the showcase (${res.status})`)
        const saved = (await res.json()) as ShowcaseItem
        setItems((prev) => prev.map((i) => (i.id === temp.id ? saved : i)))
        notify.success(T.toast.showcaseUpdated)
      } catch (err) {
        console.error('[useShowcase] add', err)
        setItems((prev) => prev.filter((i) => i.id !== temp.id))
        notify.error(T.toast.showcaseFailed)
      }
    },
    [items, T],
  )

  const remove = useCallback(
    async (item: ShowcaseItem) => {
      const before = items
      setItems((prev) => prev.filter((i) => i.id !== item.id))
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
    [items, T],
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
    [items, T],
  )

  const answered = loadedKey === reloadKey
  return { items, isLoading: !answered, error: answered && failed, retry, has, add, remove, reorder, full: items.length >= SHOWCASE_MAX }
}
