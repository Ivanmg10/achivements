'use client'

import { useState, useEffect } from 'react'
import { IconPlus, IconShield } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import AdminCreateUserModal from './AdminCreateUserModal'
import AdminEditUserModal from './AdminEditUserModal'
import AdminUserRow from './admin-user-row/AdminUserRow'
import Spinner from '@/components/main-spinner/Spinner'
import type { AdminUser } from '@/types/user'

export default function AdminPanel() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)

  const currentAdminId = Number(session?.user?.id)

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

  return (
    <section className="w-[95%] pb-6 flex flex-col gap-4 mt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconShield size={18} className="text-accent" />
          <h2 className="text-lg font-bold">Admin panel</h2>
          <span className="text-xs bg-accent text-bg-main font-bold px-2 py-0.5 rounded-full">
            {users.length}
          </span>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent text-bg-main text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          <IconPlus size={14} />
          New user
        </button>
      </div>

      <div className="bg-bg-card rounded-3xl overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-text-secondary text-sm">
            <Spinner size={20} />
            Loading users...
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-12 text-red-400 text-sm">{error}</div>
        )}
        {!loading && !error && (
          <div className="divide-y divide-bg-main">
            {users.map((user) => (
              <AdminUserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentAdminId}
                onEdit={() => setEditUser(user)}
                onToggleAdmin={() => toggleAdmin(user)}
              />
            ))}
          </div>
        )}
      </div>

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

