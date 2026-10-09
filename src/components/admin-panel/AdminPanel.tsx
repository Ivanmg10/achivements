'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import { IconLock, IconPlus, IconSearch, IconShield } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import AdminCreateUserModal from './AdminCreateUserModal'
import AdminEditUserModal from './AdminEditUserModal'
import AdminUserCard from './admin-user-card/AdminUserCard'
import AdminUnlock from './admin-unlock/AdminUnlock'
import AdminActionLog from './admin-action-log/AdminActionLog'
import AdminPsnToken from './admin-psn-token/AdminPsnToken'
import DeleteConfirmDialog from '@/components/groups/delete-confirm-dialog/DeleteConfirmDialog'
import Spinner from '@/components/main-spinner/Spinner'
import { normalizeTitle } from '@/utils/gameCandidates'
import { ADMIN_LOCKED_EVENT, adminFetch } from '@/utils/adminFetch'
import type { AdminUser } from '@/types/user'
import { notify } from '@/lib/notify'

/** What the panel is showing, for a container that sizes itself to it. */
export type AdminPanelMode = 'loading' | 'locked' | 'open'

export default function AdminPanel({
  headerEnd,
  onModeChange,
}: {
  /** Rendered at the end of the header row, e.g. the modal's close button. */
  headerEnd?: ReactNode
  onModeChange?: (mode: AdminPanelMode) => void
} = {}) {
  const { data: session } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [query, setQuery] = useState('')
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Whether the panel must be unlocked with the admin's password first (see adminAuth).
  const [locked, setLocked] = useState(false)

  const currentAdminId = Number(session?.user?.id)

  const mode: AdminPanelMode = locked ? 'locked' : loading && users.length === 0 ? 'loading' : 'open'
  useEffect(() => {
    onModeChange?.(mode)
  }, [mode, onModeChange])

  // Name, email, id or a linked account — whatever an admin has to hand.
  const visible = useMemo(() => {
    const q = normalizeTitle(query.trim())
    if (!q) return users
    return users.filter((u) =>
      [u.username, u.email, String(u.id), u.rausername, u.ra_display, u.steamusername, u.psnusername].some(
        (field) => field && normalizeTitle(field).includes(q),
      ),
    )
  }, [users, query])

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

  const loadUsers = () => {
    setLoading(true)
    setError(null)
    fetchUsers()
  }

  useEffect(() => {
    fetchUsers()
    // Any admin call that finds the unlock expired sends the panel back to the door.
    const lock = () => {
      setLocked(true)
      setUsers([])
      setEditUser(null)
    }
    window.addEventListener(ADMIN_LOCKED_EVENT, lock)
    return () => window.removeEventListener(ADMIN_LOCKED_EVENT, lock)
  }, [fetchUsers])

  const handleUnlocked = () => {
    setLocked(false)
    loadUsers()
  }

  const lockNow = async () => {
    await fetch('/api/admin/unlock', { method: 'DELETE' }).catch(() => null)
    window.dispatchEvent(new Event(ADMIN_LOCKED_EVENT))
  }

  const handleCreated = (user: AdminUser) => {
    setUsers((prev) => [...prev, user])
  }

  const handleChanged = (userId: number, changes: Partial<AdminUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...changes } : u)))
    if (editUser?.id === userId) {
      setEditUser((prev) => (prev ? { ...prev, ...changes } : prev))
    }
  }

  const handleUpdated = (userId: number, field: string, value: unknown) =>
    handleChanged(userId, { [field]: value } as Partial<AdminUser>)

  const toggleAdmin = async (user: AdminUser) => {
    if (user.id === currentAdminId) return
    const next = !user.admin
    const res = await adminFetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, field: 'admin', value: next }),
    })
    if (res.ok) {
      handleUpdated(user.id, 'admin', next)
      notify.success(next ? `${user.username} is now an admin` : `${user.username} is no longer an admin`)
    } else {
      notify.error(`Could not change ${user.username}'s role`)
    }
  }

  const confirmDelete = async () => {
    if (!deleteUser) return
    setDeleteError(null)
    try {
      const res = await adminFetch(`/api/admin/users?id=${deleteUser.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.error ?? 'Failed to delete user')
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
      notify.success(`${deleteUser.username} deleted`)
    } catch {
      setDeleteError('Failed to delete user')
    } finally {
      setDeleteUser(null)
    }
  }

  return (
    <section className="w-full pb-6 flex flex-col gap-4">
      {/* Sticks to the top of the modal, so search, lock and close stay at hand in a long list. */}
      <div className="sticky top-0 z-10 -mx-1 px-1 pt-5 pb-3 bg-bg-header flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <IconShield size={18} className="text-accent" />
          <h2 className="text-lg font-bold">Admin panel</h2>
          {!locked && (
            <span className="text-xs bg-accent text-bg-main font-bold px-2 py-0.5 rounded-full">
              {users.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-auto">
        {!locked && <>
          <div className="relative">
            <IconSearch
              size={15}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users…"
              aria-label="Search users"
              className="bg-bg-card rounded-xl pl-9 pr-3 py-2 text-sm text-text-main placeholder:text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-accent/70 w-56"
            />
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-bg-main text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <IconPlus size={14} aria-hidden="true" />
            New user
          </button>
          <button
            onClick={lockNow}
            className="flex items-center gap-1.5 px-3 py-2 bg-bg-card text-text-secondary text-sm rounded-xl hover:text-text-main transition-colors"
          >
            <IconLock size={14} aria-hidden="true" />
            Lock
          </button>
        </>}
        {headerEnd}
        </div>
      </div>

      {locked ? <AdminUnlock onUnlocked={handleUnlocked} /> : <>
      <AdminPsnToken />
      <div>
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-text-secondary text-sm">
            <Spinner size={20} />
            Loading users...
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-12 text-red-400 text-sm">{error}</div>
        )}
        {!loading && !error && visible.length === 0 && (
          <p className="py-12 text-center text-text-secondary text-sm">No users match that search</p>
        )}
        {!loading && !error && visible.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-stretch">
            {visible.map((user) => (
              <AdminUserCard
                key={user.id}
                user={user}
                isSelf={user.id === currentAdminId}
                onEdit={() => setEditUser(user)}
                onToggleAdmin={() => toggleAdmin(user)}
                onDelete={() => setDeleteUser(user)}
              />
            ))}
          </ul>
        )}
      </div>

      {deleteError && (
        <p role="alert" className="text-sm text-red-400">
          {deleteError}
        </p>
      )}

      <AdminActionLog />
      </>}

      <DeleteConfirmDialog
        isOpen={deleteUser !== null}
        onClose={() => setDeleteUser(null)}
        onConfirm={confirmDelete}
        message={`Delete ${deleteUser?.username} and everything they own? This cannot be undone.`}
        confirmLabel="Delete user"
      />

      <AdminCreateUserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      {editUser && (
        <AdminEditUserModal
          // A new user is a new form: the key starts it from that user's values.
          key={editUser.id}
          isOpen
          onClose={() => setEditUser(null)}
          user={editUser}
          onUpdated={handleUpdated}
          onChanged={handleChanged}
          currentAdminId={currentAdminId}
        />
      )}
    </section>
  )
}

