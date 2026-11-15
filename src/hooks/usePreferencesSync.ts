import { useEffect, useRef } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useLanguage } from '@/context/LanguageContext'
import { applyStoredValue, observeStoredWrites, readStoredValue, storedKeys } from '@/hooks/useStorageValue'
import { isSyncedKey } from '@/utils/syncedPreferences'
import { notify } from '@/lib/notify'
import { bootstrapPart } from '@/lib/bootstrapParts'

/** Changes are sent together, this long after the last one: a toggle clicked three times is one request. */
const FLUSH_DELAY_MS = 800

type Changes = Record<string, string | null>

async function putChanges(changes: Changes): Promise<void> {
  const res = await fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes }),
    keepalive: true,
  })
  if (!res.ok) throw new Error(`Saving preferences failed (${res.status})`)
}

/** What the account holds: from the start-up bootstrap when it has it, else its own route. */
async function accountPreferences(userId: string): Promise<Record<string, unknown>> {
  const fromBootstrap = await bootstrapPart(userId, 'preferences')
  if (fromBootstrap) return fromBootstrap
  const res = await fetch('/api/preferences')
  if (!res.ok) throw new Error(`Loading preferences failed (${res.status})`)
  const body = (await res.json()) as { preferences?: Record<string, unknown> }
  return body.preferences ?? {}
}

/**
 * Keeps the display preferences that live in this browser (which consoles show,
 * the library layout, a few switches — see syncedPreferences) the same on the
 * account, so they follow the person between devices.
 *
 * On sign-in: what the account holds is applied here (the account wins), and
 * what this browser has that the account does not goes up once, so preferences
 * set before this existed are not lost. From then on every change is sent after
 * a short pause. A change that cannot be saved stays in this browser and says so.
 */
export function usePreferencesSync() {
  const { status, data: session } = useAuthSession()
  const { T } = useLanguage()
  const userId = status === 'authenticated' ? (session?.user?.id ?? null) : null
  // The message is read when something fails, not when the sync starts.
  const failedText = useRef(T.toast.prefsSyncFailed)
  useEffect(() => {
    failedText.current = T.toast.prefsSyncFailed
  }, [T])

  useEffect(() => {
    if (!userId) return
    let current = true
    let stop: (() => void) | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    const pending: Changes = {}

    const flush = async () => {
      const changes = { ...pending }
      for (const key of Object.keys(pending)) delete pending[key]
      if (Object.keys(changes).length === 0) return
      try {
        await putChanges(changes)
      } catch (err) {
        console.error('[preferences] save', err)
        notify.error(failedText.current)
      }
    }

    accountPreferences(userId)
      .then(async (server) => {
        if (!current) return

        // The account wins where it has a value.
        for (const [key, value] of Object.entries(server)) {
          if (isSyncedKey(key) && typeof value === 'string' && readStoredValue(key) !== value) applyStoredValue(key, value)
        }
        // What only this browser has goes up once.
        const bootstrap: Changes = {}
        for (const key of storedKeys()) {
          const value = readStoredValue(key)
          if (isSyncedKey(key) && value !== null && !(key in server)) bootstrap[key] = value
        }
        if (Object.keys(bootstrap).length > 0) await putChanges(bootstrap)
        if (!current) return

        stop = observeStoredWrites((key, value) => {
          if (!isSyncedKey(key)) return
          pending[key] = value
          clearTimeout(timer)
          timer = setTimeout(flush, FLUSH_DELAY_MS)
        })
      })
      .catch((err) => {
        // Loading is not something the person did: the preferences stay as this browser has them.
        console.error('[preferences] sync', err)
      })

    return () => {
      current = false
      clearTimeout(timer)
      stop?.()
      // A change still waiting goes now rather than being dropped (leaving the page, signing out).
      if (Object.keys(pending).length > 0) void flush()
    }
  }, [userId])
}
