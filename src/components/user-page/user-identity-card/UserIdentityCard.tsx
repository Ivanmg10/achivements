'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { IconLock, IconLogout, IconPencil } from '@tabler/icons-react'
import ProfileField from '@/components/user-page/profile-field/ProfileField'
import EditProfileModal, { EditProfileField } from '@/components/edit-profile-modal/EditProfileModal'
import ChangePasswordModal from '@/components/change-password-modal/ChangePasswordModal'
import { useLanguage } from '@/context/LanguageContext'
import { useUserRank } from '@/hooks/useUserRank'
import { codeToFlag, findCountry } from '@/utils/countries'

/**
 * Who you are on CheevoVault: avatar, username, id, RetroAchievements rank,
 * country and email, with the two account actions (change password, sign out)
 * kept together at the top right.
 *
 * Everything here is editable in place — the rank is the exception, since it
 * comes from RetroAchievements.
 */
export default function UserIdentityCard() {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const { rank, isLoading: rankLoading } = useUserRank()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [edit, setEdit] = useState<{ field: EditProfileField; value: string } | null>(null)

  const user = session?.user
  const country = user?.location ? findCountry(user.location) : null

  let rankValue = '—'
  if (user?.rausername) rankValue = rankLoading ? '…' : rank?.Rank ? `#${rank.Rank.toLocaleString()}` : '—'

  return (
    <section className="bg-bg-card rounded-3xl p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          <button
            onClick={() => setEdit({ field: 'avatar', value: user?.avatar ?? '' })}
            aria-label={T.userPage.editAvatar}
            className="relative group shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                width={72}
                height={72}
                className="rounded-full w-18 h-18 object-cover"
                unoptimized
              />
            ) : (
              <span className="rounded-full w-18 h-18 bg-bg-main flex items-center justify-center">
                <IconPencil size={20} className="text-text-secondary" aria-hidden="true" />
              </span>
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
            >
              <IconPencil size={16} className="text-white" />
            </span>
          </button>

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{user?.name}</h1>
              <button
                onClick={() => setEdit({ field: 'name', value: user?.name ?? '' })}
                aria-label={T.userPage.editName}
                className="text-text-secondary hover:text-text-main transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconPencil size={14} aria-hidden="true" />
              </button>
              {user?.admin && (
                <span className="text-xs bg-accent text-bg-main font-bold px-2 py-0.5 rounded-full">
                  {T.userData.admin}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary font-mono">ID: {user?.id}</p>
            {country && (
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <span aria-hidden="true">{codeToFlag(country.code)}</span>
                {country.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setPasswordOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-bg-main text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconLock size={13} aria-hidden="true" />
            {T.userData.changePassword}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/authPage' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70"
          >
            <IconLogout size={13} aria-hidden="true" />
            {T.userConfig.signOut}
          </button>
        </div>
      </div>

      <div className="bg-bg-main rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <ProfileField
          label={T.userData.email}
          value={user?.email}
          empty={T.userData.notSet}
          onEdit={() => setEdit({ field: 'email', value: user?.email ?? '' })}
        />
        <ProfileField label={T.userStats.globalRank} value={rankValue} />
        <ProfileField label={T.userData.userId} value={user?.id} />
      </div>

      <ChangePasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} />
      {edit && (
        <EditProfileModal
          isOpen
          onClose={() => setEdit(null)}
          field={edit.field}
          currentValue={edit.value}
        />
      )}
    </section>
  )
}
