'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { IconPlus, IconPencil, IconShield, IconShieldOff, IconUser } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import AdminCreateUserModal from './AdminCreateUserModal'
import AdminEditUserModal from './AdminEditUserModal'
import Spinner from '@/components/main-spinner/Spinner'
import { codeToFlag } from '@/utils/countries'
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
      .then((r) => r.json())
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
              <UserRow
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

function UserRow({
  user,
  isSelf,
  onEdit,
  onToggleAdmin,
}: {
  user: AdminUser
  isSelf: boolean
  onEdit: () => void
  onToggleAdmin: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-bg-main/50 transition-colors">
      {/* Avatar */}
      <div className="shrink-0">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.username}
            width={36}
            height={36}
            className="rounded-full w-9 h-9 object-cover"
            unoptimized
          />
        ) : (
          <div className="rounded-full w-9 h-9 bg-bg-main flex items-center justify-center">
            <IconUser size={16} className="text-text-secondary" />
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{user.username}</span>
          {user.admin && (
            <span className="text-xs bg-accent text-bg-main font-bold px-1.5 py-0.5 rounded-full">
              Admin
            </span>
          )}
          {isSelf && <span className="text-xs text-text-secondary italic">(you)</span>}
          {user.location && (
            <span className="text-base leading-none" aria-hidden="true">
              {codeToFlag(user.location)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-text-secondary font-mono">#{user.id}</span>
          {user.email && <span className="text-xs text-text-secondary truncate">{user.email}</span>}
          {user.rausername && (
            <span className="text-xs text-green-400 truncate">
              RA: {user.ra_display ?? user.rausername}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleAdmin}
          disabled={isSelf}
          aria-label={
            user.admin ? `Remove admin from ${user.username}` : `Make ${user.username} admin`
          }
          className={`p-2 rounded-lg transition-colors ${
            isSelf
              ? 'opacity-30 cursor-not-allowed text-text-secondary'
              : user.admin
                ? 'text-accent hover:bg-accent/10'
                : 'text-text-secondary hover:bg-bg-main hover:text-text-main'
          }`}
        >
          {user.admin ? (
            <IconShield size={15} aria-hidden="true" />
          ) : (
            <IconShieldOff size={15} aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onEdit}
          aria-label={`Edit ${user.username}`}
          className="p-2 rounded-lg text-text-secondary hover:bg-bg-main hover:text-text-main transition-colors"
        >
          <IconPencil size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
