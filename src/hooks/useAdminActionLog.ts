import { useCallback, useEffect, useRef, useState } from 'react'
import { adminFetch } from '@/utils/adminFetch'

export type AdminActionEntry = {
  id: number
  admin_username: string
  target_username: string | null
  action: string
  detail: Record<string, unknown> | null
  created_at: string
}

/** The admin panel's action log: the last actions, read once when its tab opens (`retry` asks again). */
export function useAdminActionLog() {
  const [entries, setEntries] = useState<AdminActionEntry[] | null>(null)
  const [error, setError] = useState(false)
  const started = useRef(false)

  const load = useCallback(() => {
    adminFetch('/api/admin/actions')
      .then(async (res) => {
        if (!res.ok) throw new Error(`actions ${res.status}`)
        setEntries(await res.json())
        setError(false)
      })
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    load()
  }, [load])

  const retry = useCallback(() => {
    setError(false)
    load()
  }, [load])

  return { entries, error, retry }
}
