'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconArrowsDiff, IconPencil, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { CheevoUser } from '@/hooks/useCheevoUser'
import { codeToFlag, findCountry } from '@/utils/countries'
import UserProfileBanner from '@/components/user-page/user-profile-banner/UserProfileBanner'
import PublicUserPlatformChips from '../public-user-platform-chips/PublicUserPlatformChips'
import PublicUserShareButton from '../public-user-share-button/PublicUserShareButton'
import PublicUserKpis from '../public-user-kpis/PublicUserKpis'

/**
 * The top of a user's page, in the account card's style: their avatar's
 * colours washing across it, who they are and where they play, what to do
 * (compare, copy the link — or edit, on your own) and their pace in numbers.
 */
export default function PublicUserHero({ user, onCompare }: { user: CheevoUser; onCompare?: () => void }) {
  const { T } = useLanguage()
  const country = user.location ? findCountry(user.location) : null

  return (
    <section aria-labelledby="public-user-name" className="relative bg-bg-card rounded-3xl overflow-hidden">
      <UserProfileBanner avatar={user.avatar} />

      <div className="relative px-4 sm:px-6 pt-6 pb-5 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                width={112}
                height={112}
                className="rounded-full w-20 h-20 sm:w-28 sm:h-28 object-cover shrink-0 bg-bg-main ring-4 ring-bg-card shadow-xl shadow-black/40"
                unoptimized
              />
            ) : (
              <span aria-hidden="true" className="rounded-full w-20 h-20 sm:w-28 sm:h-28 bg-bg-main ring-4 ring-bg-card flex items-center justify-center shrink-0">
                <IconUser size={32} className="text-text-secondary" />
              </span>
            )}

            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 id="public-user-name" className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  {user.username}
                </h1>
                {user.isSelf && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                    {T.userProfile.yourProfile}
                  </span>
                )}
              </div>
              {country && (
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <span className="text-lg leading-none" aria-hidden="true">{codeToFlag(country.code)}</span>
                  {country.name}
                </p>
              )}
              <PublicUserPlatformChips user={user} />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {user.isSelf ? (
              <Link
                href="/user"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-bg-main text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconPencil size={13} aria-hidden="true" />
                {T.userProfile.editProfile}
              </Link>
            ) : onCompare ? (
              <button
                type="button"
                onClick={onCompare}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-accent text-bg-main hover:bg-accent/85 shadow-lg shadow-black/20 transition-colors font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconArrowsDiff size={13} aria-hidden="true" />
                {T.userProfile.compareWithMe}
              </button>
            ) : null}
            <PublicUserShareButton />
          </div>
        </div>

        {user.description && (
          <p className="text-sm text-text-main whitespace-pre-line wrap-break-word max-w-3xl">{user.description}</p>
        )}

        {(user.ra || user.steam || user.psn) && <PublicUserKpis />}
      </div>
    </section>
  )
}
