'use client'

import { Session } from 'next-auth'
import Image from 'next/image'
import { useState } from 'react'
import { IconPencil, IconLock, IconLogout } from '@tabler/icons-react'
import { signOut, useSession } from 'next-auth/react'
import RaLoginModal from '../ra-login-modal/RaLoginModal'
import FavoriteGameModal from './FavoriteGameModal'
import EditProfileModal, { EditProfileField } from '../edit-profile-modal/EditProfileModal'
import LanguageModal from '../language-modal/LanguageModal'
import LocationModal from '../location-modal/LocationModal'
import ChangePasswordModal from '../change-password-modal/ChangePasswordModal'
import ThemeModal from '../theme-modal/ThemeModal'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { useGamesData } from '@/context/GamesDataContext'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { RetroAchievementsUserProfile } from '@/types/types'
import { codeToFlag, findCountry } from '@/utils/countries'

function InfoRow({
  label,
  value,
  mono,
  placeholder,
  onEdit,
}: {
  label: string
  value?: string | null
  mono?: boolean
  placeholder?: string
  onEdit?: () => void
}) {
  const content = (
    <>
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm ${mono ? 'font-mono' : 'font-medium'} ${!value ? 'text-text-secondary italic' : ''} break-all`}
        >
          {value || placeholder || '—'}
        </span>
        {onEdit && (
          <IconPencil
            size={13}
            className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  )

  if (onEdit) {
    return (
      <button
        onClick={onEdit}
        className="flex flex-col gap-0.5 cursor-pointer group text-left"
        aria-label={`Edit ${label}`}
      >
        {content}
      </button>
    )
  }

  return <div className="flex flex-col gap-0.5">{content}</div>
}

export default function UserData({ session }: { session: Session | null }) {
  const [raModalOpen, setRaModalOpen] = useState(false)
  const [langModalOpen, setLangModalOpen] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [editModal, setEditModal] = useState<{ field: EditProfileField; value: string } | null>(
    null
  )
  const [favModalOpen, setFavModalOpen] = useState(false)
  const { update } = useSession()
  const { lang, T } = useLanguage()
  const { theme } = useTheme()
  const { all, softcore, hardcore, inProgress } = useGamesData()

  const raUser = session?.user?.raUser as RetroAchievementsUserProfile | null | undefined

  const totalGames = all.length
  const completedSC = softcore.filter((g) => parseFloat(g.PctWon) >= 1).length
  const completedHC = hardcore.filter((g) => parseFloat(g.PctWon) >= 1).length

  const openEdit = (field: EditProfileField, value: string) => setEditModal({ field, value })

  const handleSaveFavorite = async (
    game: { id: number; title: string; imageIcon: string } | null
  ) => {
    if (game) {
      await fetch('/api/updateFavoriteGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      })
    } else {
      await fetch('/api/updateFavoriteGame', { method: 'DELETE' })
    }
    await update({ favorite_game: game })
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-3 pb-3 w-[95%]">
      {/* LOCAL ACCOUNT — col-span-2 */}
      <article className="lg:col-span-2 bg-bg-card rounded-3xl p-5 flex flex-col gap-4">
        {/* Header: avatar + name + action buttons */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar with hover edit overlay */}
            <button
              className="relative group shrink-0 cursor-pointer"
              onClick={() => openEdit('avatar', session?.user?.avatar ?? '')}
              aria-label="Edit avatar"
            >
              {session?.user?.avatar ? (
                <Image
                  className="rounded-full w-16 h-16 object-cover"
                  src={session.user.avatar}
                  alt={session.user.name ?? 'avatar'}
                  width={64}
                  height={64}
                  unoptimized
                />
              ) : (
                <div className="rounded-full w-16 h-16 bg-bg-main flex items-center justify-center">
                  <IconPencil size={20} className="text-text-secondary" aria-hidden="true" />
                </div>
              )}
              <div
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              >
                <IconPencil size={16} className="text-white" />
              </div>
            </button>

            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xl font-bold">{session?.user?.name}</p>
                <button
                  onClick={() => openEdit('name', session?.user?.name ?? '')}
                  className="text-text-secondary hover:text-text-main transition-colors"
                  aria-label="Edit username"
                >
                  <IconPencil size={14} aria-hidden="true" />
                </button>
                {session?.user?.admin && (
                  <span className="text-xs bg-accent text-bg-main font-bold px-2 py-0.5 rounded-full">
                    {T.userData.admin}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary font-mono">ID: {session?.user?.id}</p>
            </div>
          </div>

          {/* Action buttons — top right */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPasswordModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-bg-main text-text-secondary hover:text-text-main transition-colors"
            >
              <IconLock size={13} aria-hidden="true" />
              {T.userData.changePassword}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/authPage' })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-medium"
            >
              <IconLogout size={13} aria-hidden="true" />
              {T.userConfig.signOut}
            </button>
          </div>
        </div>

        {/* DB fields grid */}
        <div className="bg-bg-main rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <InfoRow
            label={T.userData.email}
            value={session?.user?.email}
            onEdit={() => openEdit('email', session?.user?.email ?? '')}
            placeholder="—"
          />
          {/* Location — flag selector */}
          <button
            className="flex flex-col gap-0.5 cursor-pointer group text-left"
            onClick={() => setLocationModalOpen(true)}
            aria-label={`Edit ${T.userData.location}`}
          >
            <span className="text-xs text-text-secondary">{T.userData.location}</span>
            <div className="flex items-center gap-2">
              {session?.user?.location ? (
                <>
                  <span className="text-lg leading-none" aria-hidden="true">
                    {codeToFlag(session.user.location)}
                  </span>
                  <span className="text-sm font-medium">
                    {findCountry(session.user.location)?.name ?? session.user.location}
                  </span>
                </>
              ) : (
                <span className="text-sm text-text-secondary italic">{T.userData.notSet}</span>
              )}
              <IconPencil
                size={13}
                className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </div>
          </button>
          {/* Language — opens modal */}
          <button
            className="flex flex-col gap-0.5 cursor-pointer group text-left"
            onClick={() => setLangModalOpen(true)}
            aria-label={`Edit ${T.userConfig.language}`}
          >
            <span className="text-xs text-text-secondary">{T.userConfig.language}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium uppercase">{lang}</span>
              <IconPencil
                size={13}
                className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </div>
          </button>
          {/* Theme — opens modal */}
          <button
            className="flex flex-col gap-0.5 cursor-pointer group text-left"
            onClick={() => setThemeModalOpen(true)}
            aria-label={`Edit ${T.userTheme.theme}`}
          >
            <span className="text-xs text-text-secondary">{T.userTheme.theme}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium capitalize">{theme}</span>
              <IconPencil
                size={13}
                className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </div>
          </button>

          {/* Favourite game — picker */}
          <button
            className="flex flex-col gap-0.5 cursor-pointer group text-left"
            onClick={() => setFavModalOpen(true)}
            aria-label={T.userData.favoriteGame}
          >
            <span className="text-xs text-text-secondary">{T.userData.favoriteGame}</span>
            {session?.user?.favorite_game ? (
              <div className="flex items-center gap-1.5">
                {session.user.favorite_game.imageIcon && (
                  <Image
                    src={`https://retroachievements.org${session.user.favorite_game.imageIcon}`}
                    alt={session.user.favorite_game.title}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded object-cover shrink-0"
                    unoptimized
                  />
                )}
                <span className="text-sm font-medium truncate max-w-30">
                  {session.user.favorite_game.title}
                </span>
                <IconPencil
                  size={13}
                  className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-sm text-text-secondary italic">
                  {T.userData.favoriteGameChange}
                </span>
                <IconPencil
                  size={13}
                  className="shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                />
              </div>
            )}
          </button>
        </div>
      </article>

      {/* CONNECTED ACCOUNTS */}
      <article className="bg-bg-card rounded-3xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {T.userData.connectedAccounts}
        </h2>

        {/* RA */}
        <div className="bg-bg-main rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">RetroAchievements</span>
            {session?.user?.rausername ? (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                {T.userData.connected}
              </span>
            ) : (
              <button
                onClick={() => setRaModalOpen(true)}
                className="text-xs bg-accent text-bg-main px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
              >
                {T.userData.connect}
              </button>
            )}
          </div>

          {raUser?.User ? (
            <>
              <div className="flex items-center gap-3">
                {raUser.UserPic && (
                  <Image
                    src={`https://retroachievements.org${raUser.UserPic}`}
                    alt={raUser.User}
                    width={48}
                    height={48}
                    className="rounded-lg w-12 h-12 object-cover shrink-0"
                    unoptimized
                  />
                )}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold truncate">{raUser.User}</span>
                  <span className="text-xs text-text-secondary font-mono truncate">
                    {raUser.ULID}
                  </span>
                  <span className="text-xs text-text-secondary">
                    HC:{' '}
                    <span className="text-text-main">{raUser.TotalPoints?.toLocaleString()}</span>
                    {' · '}SC:{' '}
                    <span className="text-text-main">
                      {raUser.TotalSoftcorePoints?.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => unlinkRaUser(update)}
                className="w-full bg-red-500 text-white font-bold py-2 rounded-xl hover:opacity-90 transition-opacity text-sm"
              >
                {T.userConfig.signOutRA}
              </button>
            </>
          ) : (
            <p className="text-sm text-text-secondary">{T.userData.notConnected}</p>
          )}
        </div>

        {/* Steam */}
        <div className="bg-bg-main rounded-xl p-4 flex flex-col gap-3 opacity-60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">Steam</span>
            <span className="text-xs bg-bg-card text-text-secondary px-2 py-0.5 rounded-full">
              {T.userData.comingSoon}
            </span>
          </div>
          {session?.user?.steamusername ? (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">{session.user.steamusername}</span>
              {session.user.steamid && (
                <span className="text-xs text-text-secondary font-mono">
                  {session.user.steamid}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">{T.userData.notConnected}</p>
          )}
        </div>
      </article>

      <FavoriteGameModal
        isOpen={favModalOpen}
        current={session?.user?.favorite_game ?? null}
        onClose={() => setFavModalOpen(false)}
        onSave={handleSaveFavorite}
      />
      <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
      <ThemeModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <RaLoginModal isOpen={raModalOpen} setIsOpen={setRaModalOpen} />
      <LanguageModal isOpen={langModalOpen} onClose={() => setLangModalOpen(false)} />
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentCode={session?.user?.location}
      />

      {editModal && (
        <EditProfileModal
          isOpen
          onClose={() => setEditModal(null)}
          field={editModal.field}
          currentValue={editModal.value}
        />
      )}
    </section>
  )
}
