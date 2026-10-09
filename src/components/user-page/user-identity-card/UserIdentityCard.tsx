'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { IconAlertTriangle, IconCircleCheck, IconDeviceGamepad2, IconFolders, IconLock, IconLogout, IconPencil, IconPin, IconPlayerPlay, IconShield } from '@tabler/icons-react'
import ProfileField from '@/components/user-page/profile-field/ProfileField'
import UserProfileBanner from '@/components/user-page/user-profile-banner/UserProfileBanner'
import UserVaultStat from '@/components/user-page/user-vault-stat/UserVaultStat'
import AdminPanelModal from '@/components/admin-panel/admin-panel-modal/AdminPanelModal'
import EmailVerificationNotice from '@/components/user-page/email-verification-notice/EmailVerificationNotice'
import EditProfileModal, { EditProfileField } from '@/components/edit-profile-modal/EditProfileModal'
import ChangePasswordModal from '@/components/change-password-modal/ChangePasswordModal'
import UserDescriptionField from '@/components/user-page/user-description-field/UserDescriptionField'
import LocationModal from '@/components/location-modal/LocationModal'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useGroups } from '@/hooks/useGroups'
import { summarizeSteamLibrary } from '@/utils/steamFeed'
import { codeToFlag, findCountry } from '@/utils/countries'

/**
 * Who you are on CheevoVault: avatar, username, email and country, with
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
  const [locationOpen, setLocationOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [edit, setEdit] = useState<{ field: EditProfileField; value: string } | null>(null)

  const user = session?.user
  const country = user?.location ? findCountry(user.location) : null
  // Accounts made before the email became compulsory have no way back in.
  const missingEmail = Boolean(user) && !user?.email

  const steam = summarizeSteamLibrary(library)
  const completedRa = new Set(
    [...hardcore, ...softcore].filter((g) => parseFloat(g.PctWon) >= 1).map((g) => g.GameID),
  ).size

  const totals = [
    { label: T.userStats.games, value: all.length + steam.totalGames, accent: 'text-text-main', icon: <IconDeviceGamepad2 size={18} /> },
    { label: T.userStats.inProgress, value: inProgress.length + steam.playing, accent: 'text-amber-400', icon: <IconPlayerPlay size={18} /> },
    { label: T.groups.filter100, value: completedRa + steam.perfect, accent: 'text-green-400', icon: <IconCircleCheck size={18} /> },
    { label: T.groups.title, value: groups.length, accent: 'text-accent', icon: <IconFolders size={18} /> },
    { label: T.pinnedGames.title, value: pins.length, accent: 'text-blue-400', icon: <IconPin size={18} /> },
  ]

  return (
    <section className="relative bg-bg-card rounded-3xl overflow-hidden flex flex-col h-full">
      <UserProfileBanner avatar={user?.avatar} />

      <div className="relative px-4 sm:px-6 pt-6 pb-6 flex flex-col gap-5 flex-1">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
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
                className="rounded-full w-24 h-24 sm:w-28 sm:h-28 object-cover ring-4 ring-bg-card shadow-xl shadow-black/40"
                unoptimized
              />
            ) : (
              <span className="rounded-full w-24 h-24 sm:w-28 sm:h-28 bg-bg-main ring-4 ring-bg-card flex items-center justify-center">
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

          <div className="flex flex-col gap-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{user?.name}</h1>
              {user?.admin && (
                <span className="text-xs bg-accent text-bg-main font-bold px-2 py-0.5 rounded-full">
                  {T.userData.admin}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary font-mono">ID: {user?.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* The flag in the session decides the button; the panel itself asks the DB and a password. */}
          {user?.admin && (
            <button
              onClick={() => setAdminOpen(true)}
              aria-haspopup="dialog"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-accent/15 text-accent hover:bg-accent/25 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <IconShield size={13} aria-hidden="true" />
              Admin panel
            </button>
          )}
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

      <EmailVerificationNotice />

      {missingEmail && (
        <div role="alert" className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <IconAlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">{T.passwordReset.missingEmailTitle}</p>
            <p className="text-xs text-text-secondary">{T.passwordReset.missingEmailText}</p>
            <button
              onClick={() => setEdit({ field: 'email', value: '' })}
              className="self-start mt-1 text-xs font-medium text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            >
              {T.passwordReset.addEmail}
            </button>
          </div>
        </div>
      )}

      <div className="bg-bg-main rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ProfileField
          label={T.userPage.username}
          value={user?.name}
          onEdit={() => setEdit({ field: 'name', value: user?.name ?? '' })}
        />
        <ProfileField
          label={T.userData.email}
          value={user?.email}
          empty={T.userData.notSet}
          onEdit={() => setEdit({ field: 'email', value: user?.email ?? '' })}
        />
        <ProfileField
          label={T.userData.location}
          value={country?.name}
          empty={T.userData.notSet}
          onEdit={() => setLocationOpen(true)}
        >
          {country ? (
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-lg leading-none" aria-hidden="true">
                {codeToFlag(country.code)}
              </span>
              <span className="text-sm font-medium truncate">{country.name}</span>
            </span>
          ) : (
            <span className="text-sm text-text-secondary italic">{T.userData.notSet}</span>
          )}
        </ProfileField>
        <div className="sm:col-span-3">
          <UserDescriptionField />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {T.userPage.library}
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
          {totals.map((total) => (
            <UserVaultStat key={total.label} {...total} />
          ))}
        </dl>
      </div>
      </div>

      <ChangePasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} />
      {user?.admin && <AdminPanelModal isOpen={adminOpen} onClose={() => setAdminOpen(false)} />}
      <LocationModal
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
        currentCode={user?.location}
      />
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
