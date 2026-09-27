'use client'

import { useState, useEffect, useMemo } from 'react'
import { IconPlus, IconSearch, IconShield } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import AdminCreateUserModal from './AdminCreateUserModal'
import AdminEditUserModal from './AdminEditUserModal'
import AdminUserCard from './admin-user-card/AdminUserCard'
import DeleteConfirmDialog from '@/components/groups/delete-confirm-dialog/DeleteConfirmDialog'
import Spinner from '@/components/main-spinner/Spinner'
import { normalizeTitle } from '@/utils/gameCandidates'
import type { AdminUser } from '@/types/user'

export default function AdminPanel() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [query, setQuery] = useState('')
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const currentAdminId = Number(session?.user?.id)

  // Name, email, id or a linked account — whatever an admin has to hand.
  const visible = useMemo(() => {
    const q = normalizeTitle(query.trim())
    if (!q) return users
    return users.filter((u) =>
      [u.username, u.email, String(u.id), u.rausername, u.ra_display, u.steamusername].some(
        (field) => field && normalizeTitle(field).includes(q),
      ),
    )
  }, [users, query])

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load users')
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setUsers(data)
        else setError(data.error ?? 'Failed to load users')
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreated = (user: AdminUser) => {
    setUsers((prev) => [...prev, user])
  }

  const handleUpdated = (userId: number, field: string, value: unknown) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u)))
    if (editUser?.id === userId) {
      setEditUser((prev) => (prev ? { ...prev, [field]: value } : prev))
    }
  }

  const toggleAdmin = async (user: AdminUser) => {
    if (user.id === currentAdminId) return
    const next = !user.admin
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, field: 'admin', value: next }),
    })
    if (res.ok) handleUpdated(user.id, 'admin', next)
  }

  const confirmDelete = async () => {
    if (!deleteUser) return
    setDeleteError(null)
    try {
      const res = await fetch(`/api/admin/users?id=${deleteUser.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.error ?? 'Failed to delete user')
        return
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
    } catch {
      setDeleteError('Failed to delete user')
    } finally {
      setDeleteUser(null)
    }
  }

  return (
    <section className="w-full pb-6 flex flex-col gap-4 mt-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconShield size={18} className="text-accent" />
          <h2 className="text-lg font-bold">Admin panel</h2>
          <span className="text-xs bg-accent text-bg-main font-bold px-2 py-0.5 rounded-full">
            {users.length}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
            <IconPlus size={14} />
            New user
          </button>
        </div>
      </div>

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
          isOpen
          onClose={() => setEditUser(null)}
          user={editUser}
          onUpdated={handleUpdated}
          currentAdminId={currentAdminId}
        />
      )}
    </section>
  )
}

