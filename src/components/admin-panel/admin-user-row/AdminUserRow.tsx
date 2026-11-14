'use client'

import { IconPencil, IconShield, IconShieldOff, IconTrash } from '@tabler/icons-react'
import { codeToFlag, findCountry } from '@/utils/countries'
import { ADMIN_PLATFORMS, adminAccount } from '@/utils/adminPlatforms'
import type { AdminUser } from '@/types/user'
import Avatar from '@/components/ui/Avatar'
import IconButton from '@/components/ui/IconButton'
import Tag from '@/components/ui/Tag'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { ROW, TD, TD_FIRST } from '@/components/ui/dataTable'

/**
 * One user in the admin panel's table: picture, name, id, email, the accounts they have linked as logos, whether they are
 * an admin, and what an admin does with them: grant or revoke admin, edit, delete. An admin cannot change their own role
 * or delete their own account, so both are disabled on their own row. Below `md` the email goes under the name.
 */
export default function AdminUserRow({
  user,
  isSelf,
  onEdit,
  onToggleAdmin,
  onDelete,
}: {
  user: AdminUser
  isSelf: boolean
  onEdit: () => void
  onToggleAdmin: () => void
  onDelete: () => void
}) {
  const country = user.location ? findCountry(user.location) : null
  const linked = ADMIN_PLATFORMS.map((platform) => ({ platform, account: adminAccount(user, platform) })).filter((l) => l.account)

  return (
    <tr className={ROW}>
      <td className={TD_FIRST}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={user.avatar} name={user.username} size={32} fallback="icon" />
          <div className="flex flex-col min-w-0">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold truncate">{user.username}</span>
              {country && (
                <span className="text-base leading-none" title={country.name} aria-hidden="true">
                  {codeToFlag(country.code)}
                </span>
              )}
              {user.admin && <Tag tone="accent" size="sm" className="md:hidden">Admin</Tag>}
              {isSelf && <span className="text-xs text-text-secondary italic">(you)</span>}
            </span>
            <span className="md:hidden text-xs text-text-secondary truncate">{user.email || '—'}</span>
          </div>
        </div>
      </td>
      <td className={`${TD} hidden sm:table-cell text-xs text-text-secondary font-mono`}>#{user.id}</td>
      <td className={`${TD} hidden md:table-cell text-xs text-text-secondary max-w-56 truncate`}>{user.email || '—'}</td>
      <td className={`${TD} hidden md:table-cell`}>
        {linked.length === 0 ? (
          <span className="text-text-secondary">—</span>
        ) : (
          <ul className="flex items-center gap-2.5">
            {linked.map(({ platform, account }) => (
              <li key={platform.source} title={`${platform.name}: ${account}`} className="inline-flex">
                <PlatformLogo source={platform.source} size={15} label={`${platform.name}: ${account}`} />
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className={`${TD} hidden md:table-cell`}>{user.admin && <Tag tone="accent" size="sm">Admin</Tag>}</td>
      <td className={TD}>
        <div className="flex items-center justify-end gap-0.5">
          <IconButton
            size="sm"
            onClick={onToggleAdmin}
            disabled={isSelf}
            aria-label={user.admin ? `Remove admin from ${user.username}` : `Make ${user.username} admin`}
          >
            {user.admin ? <IconShield size={15} aria-hidden="true" /> : <IconShieldOff size={15} aria-hidden="true" />}
          </IconButton>
          <IconButton size="sm" onClick={onEdit} aria-label={`Edit ${user.username}`}>
            <IconPencil size={15} aria-hidden="true" />
          </IconButton>
          <IconButton size="sm" tone="danger" onClick={onDelete} disabled={isSelf} aria-label={`Delete ${user.username}`}>
            <IconTrash size={15} aria-hidden="true" />
          </IconButton>
        </div>
      </td>
    </tr>
  )
}
