import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import type { PsnSyncState } from '@/lib/psnSnapshot'
import type { PsnSyncStage } from '@/utils/psnSyncStage'

/** How often the state is read again while a sync runs: often while the core lands, calmly after. */
const CORE_POLL_MS = 4_000
const POLL_MS = 15_000

const settled = (s: PsnSyncState) => s.stage === 'ready' || s.stage === 'private' || s.trouble === 'paused'

/**
 * The signed-in user's PSN sync as it moves (#180): `/api/psn/status`, read again while a sync runs, never
 * once it is done. The page's own reads wait out a first sync by themselves (202), so nothing is refetched
 * then; a refresh the user asked for refetches what the page shows (`onSynced`) once it ends. The first sync
 * and an asked-for refresh say so in a toast; a routine sync stays quiet. `refresh` asks for a new sync:
 * queued, already running or too soon, each said in words, never as an error.
 */
export function usePsnSync(enabled: boolean, onSynced: () => void) {
  const { T } = useLanguage()
  const [sync, setSync] = useState<PsnSyncState | null>(null)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)
  const seen = useRef<PsnSyncStage | null>(null)
  const announce = useRef(false)
  const manual = useRef(false)
  const latest = useRef({ onSynced, T })
  useEffect(() => {
    latest.current = { onSynced, T }
  })

  const apply = useCallback((next: PsnSyncState) => {
    const before = seen.current
    seen.current = next.stage
    const { onSynced: refetch, T: t } = latest.current
    // A first sync seen from its start is announced; a routine one is not.
    if (before === null && (next.stage === 'syncing_core' || next.stage === 'ready_partial')) announce.current = true
    if (before === 'syncing_core' && next.stage !== 'syncing_core' && next.stage !== 'ready' && announce.current) notify.success(t.toast.psnCoreReady)
    if (before !== null && before !== 'ready' && next.stage === 'ready') {
      if (manual.current) refetch()
      if (announce.current || manual.current) notify.success(t.toast.psnSynced)
      announce.current = false
      manual.current = false
    }
    setSync(next)
  }, [])

  useEffect(() => {
    if (!enabled) return
    let current = true
    let retry: ReturnType<typeof setTimeout> | undefined
    fetch('/api/psn/status', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return (await res.json()) as PsnSyncState
      })
      .then((next) => {
        if (!current) return
        setError(false)
        apply(next)
      })
      .catch((err: unknown) => {
        console.error('[usePsnSync]', err)
        if (!current) return
        setError(true)
        // The line is a helper, not the data: it tries again on its own.
        retry = setTimeout(() => setTick((n) => n + 1), POLL_MS)
      })
    return () => {
      current = false
      clearTimeout(retry)
    }
  }, [enabled, tick, apply])

  useEffect(() => {
    if (!sync || settled(sync)) return
    const timer = setTimeout(() => setTick((n) => n + 1), sync.stage === 'syncing_core' ? CORE_POLL_MS : POLL_MS)
    return () => clearTimeout(timer)
  }, [sync])

  const refresh = useCallback(async () => {
    const res = await fetch('/api/psn/refresh', { method: 'POST' })
    const t = latest.current.T
    if (res.status === 202) {
      manual.current = true
      // A sync is queued: whatever the next read says, its end is the end of this one.
      seen.current = 'enriching'
      setTick((n) => n + 1)
      return
    }
    if (res.status === 409) return void notify.success(t.toast.psnAlreadySyncing)
    if (res.status === 429) {
      const minutes = Math.max(1, Math.ceil(Number(res.headers.get('Retry-After') || 60) / 60))
      return void notify.success(t.toast.psnTooSoon.replace('{n}', String(minutes)))
    }
    // The refresh button says it failed and can be pressed again.
    throw new Error(`refresh ${res.status}`)
  }, [])

  return { sync, error, refresh }
}
