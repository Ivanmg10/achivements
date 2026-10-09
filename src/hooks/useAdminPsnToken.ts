import { useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/utils/adminFetch'

export type PsnTokenStatus = {
  configured: boolean
  stored: boolean
  expiresAt: string | null
  daysLeft: number | null
  updatedAt: string | null
  updatedBy: string | null
}

/** Why saving an NPSSO failed, as /api/admin/psn says it. */
export type PsnTokenError = 'invalid-npsso' | 'rejected' | 'save-failed' | 'failed'

/** The app's PSN sign-in for the admin panel: its status, and saving a new NPSSO. */
export function useAdminPsnToken() {
  const [status, setStatus] = useState<PsnTokenStatus | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<PsnTokenError | null>(null)
  const hasFetched = useRef(false)

  const load = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/psn')
      if (!res.ok) throw new Error(`PSN status ${res.status}`)
      setStatus((await res.json()) as PsnTokenStatus)
      setLoadError(false)
    } catch (err) {
      console.error('[useAdminPsnToken] load', err)
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    load()
  }, [load])

  const save = useCallback(
    async (npsso: string): Promise<boolean> => {
      setSaving(true)
      setSaveError(null)
      try {
        const res = await adminFetch('/api/admin/psn', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ npsso }),
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          const known: PsnTokenError[] = ['invalid-npsso', 'rejected', 'save-failed']
          setSaveError(known.find((e) => e === data?.error) ?? 'failed')
          return false
        }
        await load()
        return true
      } catch (err) {
        console.error('[useAdminPsnToken] save', err)
        setSaveError('failed')
        return false
      } finally {
        setSaving(false)
      }
    },
    [load],
  )

  return { status, loadError, saving, saveError, save, retry: load }
}
