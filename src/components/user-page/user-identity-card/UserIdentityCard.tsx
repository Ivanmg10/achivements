'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'
import { IconAlertTriangle, IconPencil } from '@tabler/icons-react'
import ProfileField from '@/components/user-page/profile-field/ProfileField'
import UserProfileBanner from '@/components/user-page/user-profile-banner/UserProfileBanner'
import UserVaultStat from '@/components/user-page/user-vault-stat/UserVaultStat'
import UserFollowStats from '@/components/user-page/user-follow-stats/UserFollowStats'
import UserVaultLevel from '@/components/user-page/user-vault-level/UserVaultLevel'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import EmailVerificationNotice from '@/components/user-page/email-verification-notice/EmailVerificationNotice'
import type { EditProfileField } from '@/components/edit-profile-modal/EditProfileModal'
import UserDescriptionField from '@/components/user-page/user-description-field/UserDescriptionField'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useGroups } from '@/hooks/useGroups'
import { summarizeSteamLibrary } from '@/utils/steamFeed'
import { codeToFlag, countryName, findCountry } from '@/utils/countries'
import Button from '@/components/ui/Button'

// Modals are downloaded the first time they are wanted, not with the page — the admin panel above all.
const AdminPanelModal = dynamic(() => import('@/components/admin-panel/admin-panel-modal/AdminPanelModal'), { loading: () => null })
const EditProfileModal = dynamic(() => import('@/components/edit-profile-modal/EditProfileModal'), { loading: () => null })
const AvatarModal = dynamic(() => import('@/components/avatar-modal/AvatarModal'), { loading: () => null })
const ChangePasswordModal = dynamic(() => import('@/components/change-password-modal/ChangePasswordModal'), { loading: () => null })
const LocationModal = dynamic(() => import('@/components/location-modal/LocationModal'), { loading: () => null })

/**
 * Who you are on CheevoVault: avatar and username, with the id, country and
 * follows in a line under it, and change password and sign out beside them.
 * Then your level, the account's fields (username, email, country, your
 * words) and what the account holds (games, groups and pins), counted across
 * every connected platform, since nothing here belongs to one of them.
 */
export default function UserIdentityCard() {
  const { data: session } = useSession()
  const { T, lang } = useLanguage()
  const { all, inProgress, hardcore, softcore } = useGamesData()
  const { library } = useSteamGamesData()
  const { pins } = usePinnedGames()
  const { groups } = useGroups()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [edit, setEdit] = useState<{ field: EditProfileField; value: string } | null>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const user = session?.user
  const found = user?.location ? findCountry(user.location) : null
  const country = found ? { ...found, name: countryName(found.code, lang) } : null
  // Accounts made before the email became compulsory have no way back in.
  const missingEmail = Boolean(user) && !user?.email

  const steam = summarizeSteamLibrary(library)
  const completedRa = new Set(
    [...hardcore, ...softcore].filter((g) => parseFloat(g.PctWon) >= 1).map((g) => g.GameID),
  ).size

  const totals = [
    { label: T.userStats.games, value: all.length + steam.totalGames, accent: 'text-text-main' },
    { label: T.userStats.inProgress, value: inProgress.length + steam.playing, accent: 'text-text-main' },
    { label: T.groups.filter100, value: completedRa + steam.perfect, accent: 'text-success' },
    { label: T.groups.title, value: groups.length, accent: 'text-text-main' },
    { label: T.pinnedGames.title, value: pins.length, accent: 'text-text-main' },
  ]

  return (
    <section className="relative bg-bg-card rounded-[1.25rem] ring-1 ring-inset ring-ink/[0.06] overflow-hidden flex flex-col">
      <UserProfileBanner avatar={user?.avatar} />

      <div className="relative px-4 sm:px-7 pt-6 sm:pt-7 pb-6 sm:pb-7 flex flex-col gap-4 flex-1">
      <div className="flex items-end justify-between gap-x-5 gap-y-4 flex-wrap">
        <div className="flex items-end gap-4 sm:gap-[1.375rem] min-w-0">
          <button
            onClick={() => setAvatarOpen(true)}
            aria-label={T.userPage.editAvatar}
            className="relative group shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                width={112}
                height={112}
                className="rounded-full w-24 h-24 sm:w-28 sm:h-28 object-cover ring-4 ring-bg-card shadow-[0_14px_30px_rgb(0_0_0/0.5)]"
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

          <div className="flex flex-col gap-1.5 min-w-0 pb-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display italic font-extrabold text-[2.75rem] sm:text-[4rem] leading-[0.9] pr-1 truncate">{user?.name}</h1>
              {user?.admin && (
                <span className="inline-flex items-center h-[1.375rem] px-2 rounded-[0.375rem] text-xs font-bold bg-warning/20 text-warning">
                  {T.userData.admin}
                </span>
              )}
            </div>
            <p className="text-[0.8125rem] text-text-secondary">
              ID {user?.id}
              {country && (
                <>
                  {' · '}
                  <span aria-hidden="true">{codeToFlag(country.code)} </span>
                  {country.name}
                </>
              )}
              {' · '}
              <UserFollowStats />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          {/* The flag in the session decides the button; the panel itself asks the DB and a password. */}
          {user?.admin && (
            <Button variant="secondary" size="sm" onClick={() => setAdminOpen(true)} aria-haspopup="dialog">
              Admin panel
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setPasswordOpen(true)}>
            {T.userData.changePassword}
          </Button>
          <Button variant="danger" size="sm" onClick={() => signOut({ callbackUrl: '/authPage' })}>
            {T.userConfig.signOut}
          </Button>
        </div>
      </div>

      <UserVaultLevel />

      <EmailVerificationNotice />

      {missingEmail && (
        <div role="alert" className="flex items-start gap-3 bg-warning/10 ring-1 ring-inset ring-warning/30 rounded-control p-4">
          <IconAlertTriangle size={18} className="text-warning shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-semibold text-warning">{T.passwordReset.missingEmailTitle}</p>
            <p className="text-xs text-text-secondary">{T.passwordReset.missingEmailText}</p>
            <button
              onClick={() => setEdit({ field: 'email', value: '' })}
              className="self-start mt-1 text-xs font-medium text-warning underline underline-offset-2 hover:text-warning transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/70"
            >
              {T.passwordReset.addEmail}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ProfileField
          sunken
          label={T.userPage.username}
          value={user?.name}
          onEdit={() => setEdit({ field: 'name', value: user?.name ?? '' })}
        />
        <ProfileField
          sunken
          label={T.userData.email}
          value={user?.email}
          empty={T.userData.notSet}
          onEdit={() => setEdit({ field: 'email', value: user?.email ?? '' })}
        />
        <ProfileField
          sunken
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
        <div className="sm:col-span-3 flex flex-col">
          <UserDescriptionField />
        </div>
      </div>

      <div className="flex flex-col mt-auto">
        <h2 className="sr-only">{T.userPage.library}</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
          {totals.map((total) => (
            <UserVaultStat key={total.label} {...total} />
          ))}
        </dl>
      </div>
      </div>

      <LazyWhenOpened open={passwordOpen}>
        <ChangePasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} />
      </LazyWhenOpened>
      {user?.admin && (
        <LazyWhenOpened open={adminOpen}>
          <AdminPanelModal isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
        </LazyWhenOpened>
      )}
      <LazyWhenOpened open={locationOpen}>
        <LocationModal
          isOpen={locationOpen}
          onClose={() => setLocationOpen(false)}
          currentCode={user?.location}
        />
      </LazyWhenOpened>
      <LazyWhenOpened open={avatarOpen}>
        <AvatarModal isOpen={avatarOpen} onClose={() => setAvatarOpen(false)} current={user?.avatar} />
      </LazyWhenOpened>
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
