import Image from 'next/image'
import { IconPencil, IconShield, IconShieldOff, IconUser } from '@tabler/icons-react'
import { codeToFlag } from '@/utils/countries'
import type { AdminUser } from '@/types/user'

type Props = {
  user: AdminUser
  isSelf: boolean
  onEdit: () => void
  onToggleAdmin: () => void
}

export default function AdminUserRow({ user, isSelf, onEdit, onToggleAdmin }: Props) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-bg-main/50 transition-colors">
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
