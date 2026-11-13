'use client'

import type { AdminUser } from '@/types/user'
import { TABLE, TH } from '@/components/ui/dataTable'
import AdminUserRow from '../admin-user-row/AdminUserRow'

/** The users as a dense table (`ui/dataTable`'s look); what to do with one is the caller's. */
export default function AdminUsersTable({
  users,
  currentAdminId,
  onEdit,
  onToggleAdmin,
  onDelete,
}: {
  users: AdminUser[]
  currentAdminId: number
  onEdit: (user: AdminUser) => void
  onToggleAdmin: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className={TABLE}>
        <caption className="sr-only">Users</caption>
        <thead>
          <tr>
            <th scope="col" className={`${TH} text-left`}>User</th>
            <th scope="col" className={`${TH} text-left hidden sm:table-cell`}>ID</th>
            <th scope="col" className={`${TH} text-left hidden md:table-cell`}>Email</th>
            <th scope="col" className={`${TH} text-left hidden md:table-cell`}>Accounts</th>
            <th scope="col" className={`${TH} text-left hidden md:table-cell`}>Role</th>
            <th scope="col" className={`${TH} text-right`}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <AdminUserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentAdminId}
              onEdit={() => onEdit(user)}
              onToggleAdmin={() => onToggleAdmin(user)}
              onDelete={() => onDelete(user)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
