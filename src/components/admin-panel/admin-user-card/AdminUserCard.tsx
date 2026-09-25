'use client'

import Image from 'next/image'
import { IconPencil, IconShield, IconShieldOff, IconUser } from '@tabler/icons-react'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { codeToFlag, findCountry } from '@/utils/countries'
import type { AdminUser } from '@/types/user'

/**
 * One user in the admin panel, as a card: avatar, name, the accounts they
 * have linked, and the two things an admin does with them — grant or revoke
 * admin, and edit. Admins cannot change their own role, so that button is
 * disabled on their own card.
 */
export default function AdminUserCard({
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
  const country = user.location ? findCountry(user.location) : null

  return (
    <li className="bg-bg-card rounded-2xl p-4 flex flex-col gap-3 ring-1 ring-white/5 hover:ring-white/15 transition-shadow">
      <div className="flex items-start gap-3">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt=""
            width={44}
            height={44}
            className="rounded-full w-11 h-11 object-cover shrink-0"
            unoptimized
          />
        ) : (
          <span className="rounded-full w-11 h-11 bg-bg-main flex items-center justify-center shrink-0">
            <IconUser size={18} className="text-text-secondary" aria-hidden="true" />
          </span>
        )}

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold truncate">{user.username}</span>
            {country && (
              <span className="text-base leading-none" title={country.name} aria-hidden="true">
                {codeToFlag(country.code)}
              </span>
            )}
            {user.admin && (
              <span className="text-[10px] bg-accent text-bg-main font-bold px-1.5 py-0.5 rounded-full">Admin</span>
            )}
            {isSelf && <span className="text-xs text-text-secondary italic">(you)</span>}
          </span>
          <span className="text-xs text-text-secondary font-mono">#{user.id}</span>
          <span className="text-xs text-text-secondary truncate">{user.email || '—'}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-1 text-xs">
        <li className="flex items-center gap-1.5 min-w-0">
          <RaLogo height={11} className={user.rausername ? '' : 'opacity-30 grayscale'} />
          <span className={`truncate ${user.rausername ? 'text-text-secondary' : 'text-text-secondary/40'}`}>
            {user.ra_display ?? user.rausername ?? '—'}
          </span>
        </li>
        <li className="flex items-center gap-1.5 min-w-0">
          <SteamLogo size={11} className={user.steamusername ? 'text-[#66c0f4]' : 'text-text-secondary/30'} />
          <span className={`truncate ${user.steamusername ? 'text-text-secondary' : 'text-text-secondary/40'}`}>
            {user.steamusername ?? '—'}
          </span>
        </li>
      </ul>

      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={onToggleAdmin}
          disabled={isSelf}
          aria-label={user.admin ? `Remove admin from ${user.username}` : `Make ${user.username} admin`}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
            isSelf
              ? 'opacity-30 cursor-not-allowed bg-bg-main text-text-secondary'
              : user.admin
                ? 'bg-accent/15 text-accent hover:bg-accent/25'
                : 'bg-bg-main text-text-secondary hover:text-text-main'
          }`}
        >
          {user.admin ? <IconShield size={14} aria-hidden="true" /> : <IconShieldOff size={14} aria-hidden="true" />}
          {user.admin ? 'Admin' : 'Make admin'}
        </button>
        <button
          onClick={onEdit}
          aria-label={`Edit ${user.username}`}
          className="p-2 rounded-xl bg-bg-main text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconPencil size={15} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
