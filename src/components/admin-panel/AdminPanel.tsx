'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { IconLock } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import { useAdminUsers } from '@/hooks/useAdminUsers'
import AdminUnlock from './admin-unlock/AdminUnlock'
import AdminActionLog from './admin-action-log/AdminActionLog'
import AdminPsnToken from './admin-psn-token/AdminPsnToken'
import AdminRankings from './admin-rankings/AdminRankings'
import AdminUsersTab from './admin-users-tab/AdminUsersTab'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import type { AdminUser } from '@/types/user'
import Button from '@/components/ui/Button'
import Tabs, { tabIds } from '@/components/ui/Tabs'

const AdminCreateUserModal = dynamic(() => import('./AdminCreateUserModal'), { loading: () => null })
const AdminEditUserModal = dynamic(() => import('./AdminEditUserModal'), { loading: () => null })
const DeleteConfirmDialog = dynamic(() => import('@/components/groups/delete-confirm-dialog/DeleteConfirmDialog'), { loading: () => null })

/** What the panel is showing, for a container that sizes itself to it. */
export type AdminPanelMode = 'loading' | 'locked' | 'open'

type AdminTab = 'users' | 'psn' | 'rankings' | 'log'

const TABS_ID = 'admin-tabs'

export default function AdminPanel({
  onModeChange,
}: {
  onModeChange?: (mode: AdminPanelMode) => void
} = {}) {
  const { data: session } = useSession()
  const currentAdminId = Number(session?.user?.id)
  const { users, loading, error, locked, reload, unlocked, lockNow, created, changed, toggleAdmin, remove } = useAdminUsers(currentAdminId)
  const [tab, setTab] = useState<AdminTab>('users')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const mode: AdminPanelMode = locked ? 'locked' : loading && users.length === 0 ? 'loading' : 'open'
  useEffect(() => {
    onModeChange?.(mode)
  }, [mode, onModeChange])

  const handleChanged = (userId: number, changes: Partial<AdminUser>) => {
    changed(userId, changes)
    setEditUser((prev) => (prev?.id === userId ? { ...prev, ...changes } : prev))
  }

  const handleUpdated = (userId: number, field: string, value: unknown) => handleChanged(userId, { [field]: value } as Partial<AdminUser>)

  const confirmDelete = async () => {
    if (!deleteUser) return
    setDeleteError(null)
    const failed = await remove(deleteUser)
    if (failed) setDeleteError(failed)
    setDeleteUser(null)
  }

  const panel = (value: AdminTab, children: React.ReactNode) => (
    <div role="tabpanel" id={tabIds(TABS_ID, value).panel} aria-labelledby={tabIds(TABS_ID, value).tab} tabIndex={0} className="outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-tile">
      {children}
    </div>
  )

  return (
    <section className="w-full pb-2 flex flex-col gap-5">
      {locked ? (
        <AdminUnlock onUnlocked={unlocked} />
      ) : (
        <>
          <div className="flex items-end gap-3">
            <Tabs
              id={TABS_ID}
              aria-label="Admin sections"
              value={tab}
              onChange={setTab}
              className="flex-1 min-w-0"
              tabs={[
                { value: 'users', label: 'Users', count: loading || error ? undefined : users.length },
                { value: 'psn', label: 'PlayStation' },
                { value: 'rankings', label: 'Rankings' },
                { value: 'log', label: 'Log' },
              ]}
            />
            <Button variant="quiet" size="sm" onClick={lockNow} className="mb-1">
              <IconLock size={14} aria-hidden="true" />
              Lock
            </Button>
          </div>

          {tab === 'users' &&
            panel(
              'users',
              <>
                <AdminUsersTab
                  users={users}
                  loading={loading}
                  error={error}
                  currentAdminId={currentAdminId}
                  onRetry={reload}
                  onCreate={() => setCreateOpen(true)}
                  onEdit={setEditUser}
                  onToggleAdmin={toggleAdmin}
                  onDelete={setDeleteUser}
                />
                {deleteError && (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    {deleteError}
                  </p>
                )}
              </>,
            )}
          {tab === 'psn' && panel('psn', <AdminPsnToken />)}
          {tab === 'rankings' && panel('rankings', <AdminRankings />)}
          {tab === 'log' && panel('log', <AdminActionLog />)}
        </>
      )}

      <LazyWhenOpened open={deleteUser !== null}>
        <DeleteConfirmDialog
          isOpen={deleteUser !== null}
          onClose={() => setDeleteUser(null)}
          onConfirm={confirmDelete}
          message={`Delete ${deleteUser?.username} and everything they own? This cannot be undone.`}
          confirmLabel="Delete user"
        />
      </LazyWhenOpened>

      <LazyWhenOpened open={createOpen}>
        <AdminCreateUserModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={created} />
      </LazyWhenOpened>

      {editUser && !locked && (
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
