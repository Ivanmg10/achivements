'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { IconLock, IconLogout, IconPencil } from '@tabler/icons-react'
import ProfileField from '@/components/user-page/profile-field/ProfileField'
import EditProfileModal, { EditProfileField } from '@/components/edit-profile-modal/EditProfileModal'
import ChangePasswordModal from '@/components/change-password-modal/ChangePasswordModal'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useGroups } from '@/hooks/useGroups'
import { summarizeSteamLibrary } from '@/utils/steamFeed'
import { codeToFlag, findCountry } from '@/utils/countries'

/**
 * Who you are on CheevoVault: avatar, username, country, email and id, with
 * change password and sign out kept together at the top right.
 *
 * Under that, what the account holds — games, groups and pins — counted
 * across every connected platform, since nothing here belongs to one of them.
 */
export default function UserIdentityCard() {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const { all, inProgress, hardcore, softcore } = useGamesData()
  const { library } = useSteamGamesData()
  const { pins } = usePinnedGames()
  const { groups } = useGroups()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [edit, setEdit] = useState<{ field: EditProfileField; value: string } | null>(null)

  const user = session?.user
  const country = user?.location ? findCountry(user.location) : null

  const steam = summarizeSteamLibrary(library)
  const completedRa = new Set(
    [...hardcore, ...softcore].filter((g) => parseFloat(g.PctWon) >= 1).map((g) => g.GameID),
  ).size

  const totals = [
    { label: T.userStats.games, value: all.length + steam.totalGames, accent: 'text-text-main' },
    { label: T.userStats.inProgress, value: inProgress.length + steam.playing, accent: 'text-amber-400' },
    { label: T.groups.filter100, value: completedRa + steam.perfect, accent: 'text-green-400' },
    { label: T.groups.title, value: groups.length, accent: 'text-accent' },
    { label: T.pinnedGames.title, value: pins.length, accent: 'text-blue-400' },
  ]

  return (
    <section className="bg-bg-card rounded-3xl p-6 flex flex-col gap-5 h-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-5 min-w-0">
          <button
            onClick={() => setEdit({ field: 'avatar', value: user?.avatar ?? '' })}
            aria-label={T.userPage.editAvatar}
            className="relative group shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                width={112}
                height={112}
                className="rounded-full w-28 h-28 object-cover ring-2 ring-accent/40"
                unoptimized
              />
            ) : (
              <span className="rounded-full w-28 h-28 bg-bg-main flex items-center justify-center">
                <IconPencil size={24} className="text-text-secondary" aria-hidden="true" />
              </span>
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
            >
              <IconPencil size={20} className="text-white" />
            </span>
          </button>

          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold truncate">{user?.name}</h1>
              <button
                onClick={() => setEdit({ field: 'name', value: user?.name ?? '' })}
                aria-label={T.userPage.editName}
                className="text-text-secondary hover:text-text-main transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconPencil size={15} aria-hidden="true" />
              </button>
              {user?.admin && (
                <span className="text-xs bg-accent text-bg-main font-bold px-2 py-0.5 rounded-full">
                  {T.userData.admin}
                </span>
              )}
            </div>
            {country && (
              <p className="text-sm text-text-secondary flex items-center gap-1.5">
                <span aria-hidden="true">{codeToFlag(country.code)}</span>
                {country.name}
              </p>
            )}
            <p className="text-xs text-text-secondary font-mono">ID: {user?.id}</p>
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

      <div className="bg-bg-main rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ProfileField
          label={T.userData.email}
          value={user?.email}
          empty={T.userData.notSet}
          onEdit={() => setEdit({ field: 'email', value: user?.email ?? '' })}
        />
        <ProfileField label={T.userData.userId} value={user?.id} />
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {T.userPage.library}
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {totals.map((total) => (
            <div key={total.label} className="bg-bg-main rounded-2xl px-3 py-3 flex flex-col gap-0.5 min-w-0">
              <dd className={`text-2xl font-bold tabular-nums ${total.accent}`}>{total.value.toLocaleString()}</dd>
              <dt className="text-[11px] text-text-secondary truncate">{total.label}</dt>
            </div>
          ))}
        </dl>
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
