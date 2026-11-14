import { useCallback, useEffect, useState } from 'react'
import { ADMIN_LOCKED_EVENT, adminFetch } from '@/utils/adminFetch'
import { notify } from '@/lib/notify'
import type { AdminUser } from '@/types/user'

/**
 * The admin panel's users: the list (loaded when the panel opens, which is also how it learns it is locked),
 * and what an admin does with them: grant or revoke admin, delete, and the changes the edit and create
 * dialogs report. Admin copy is English, like the rest of the panel.
 */
export function useAdminUsers(currentAdminId: number) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Whether the panel must be unlocked with the admin's password first (see adminAuth).
  const [locked, setLocked] = useState(false)

  // State only changes once the answer is in, so the first load can run from an effect.
  const fetchUsers = useCallback(() => {
    adminFetch('/api/admin/users')
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (r.status === 403 && data?.error === 'reauth-required') return setLocked(true)
        if (!r.ok || !Array.isArray(data)) throw new Error('Failed to load users')
        setUsers(data)
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchUsers()
    // Any admin call that finds the unlock expired sends the panel back to the door.
    const lock = () => {
      setLocked(true)
      setUsers([])
    }
    window.addEventListener(ADMIN_LOCKED_EVENT, lock)
    return () => window.removeEventListener(ADMIN_LOCKED_EVENT, lock)
  }, [fetchUsers])

  const unlocked = useCallback(() => {
    setLocked(false)
    reload()
  }, [reload])

  const lockNow = useCallback(async () => {
    await fetch('/api/admin/unlock', { method: 'DELETE' }).catch(() => null)
    window.dispatchEvent(new Event(ADMIN_LOCKED_EVENT))
  }, [])

  const created = useCallback((user: AdminUser) => setUsers((prev) => [...prev, user]), [])

  const changed = useCallback(
    (userId: number, changes: Partial<AdminUser>) => setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...changes } : u))),
    [],
  )

  const toggleAdmin = useCallback(
    async (user: AdminUser) => {
      if (user.id === currentAdminId) return
      const next = !user.admin
      const res = await adminFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, field: 'admin', value: next }),
      })
      if (res.ok) {
        changed(user.id, { admin: next })
        notify.success(next ? `${user.username} is now an admin` : `${user.username} is no longer an admin`)
      } else {
        notify.error(`Could not change ${user.username}'s role`)
      }
    },
    [currentAdminId, changed],
  )

  /** Deletes a user; resolves to why it failed, or null when it is gone. */
  const remove = useCallback(async (user: AdminUser): Promise<string | null> => {
    try {
      const res = await adminFetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return data.error ?? 'Failed to delete user'
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      notify.success(`${user.username} deleted`)
      return null
    } catch {
      return 'Failed to delete user'
    }
  }, [])

  return { users, loading, error, locked, reload, unlocked, lockNow, created, changed, toggleAdmin, remove }
}
