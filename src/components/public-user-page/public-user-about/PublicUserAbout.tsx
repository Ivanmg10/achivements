'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconFolders, IconGenderBigender, IconPalette } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import type { CheevoUser } from '@/hooks/useCheevoUser'
import type { GameSource } from '@/types/steam'
import { candidateIconUrl } from '@/utils/gameCandidates'
import { gameHref } from '@/utils/gameRef'
import GroupCard from '@/components/groups/group-card/GroupCard'
import EmptyState from '@/components/empty-state/EmptyState'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'

const GENDER_KEYS = { male: 'genderMale', female: 'genderFemale', neutral: 'genderNeutral' } as const

const PLATFORM_ICONS: Record<GameSource, ReactNode> = {
  ra: <RaLogo height={10} />,
  steam: <SteamLogo size={14} className="text-[#66c0f4]" aria-hidden="true" />,
  psn: <PlaystationLogo size={14} className="text-[#0070d1]" aria-hidden="true" />,
  xbox: <XboxLogo size={14} className="text-[#107c10]" aria-hidden="true" />,
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-xl bg-bg-main ring-1 ring-ink/[0.06] flex items-center justify-center text-text-secondary">
        {icon}
      </span>
      <div className="flex flex-col min-w-0">
        <dt className="text-xs text-text-secondary">{label}</dt>
        <dd className="text-sm font-medium truncate">{children}</dd>
      </div>
    </div>
  )
}

/**
 * What a user chose for themselves: a favourite game per platform, their
 * theme, their gender if they show it, and the groups they made public.
 */
export default function PublicUserAbout({ user }: { user: CheevoUser }) {
  const { T } = useLanguage()
  const subject = useSubject()
  const favorites = (['ra', 'steam', 'psn', 'xbox'] as const)
    .map((source) => ({ source, game: user.favorites?.[source] ?? null }))
    .filter((f) => f.game !== null)
  const themeName = user.theme ? (T.userTheme as Record<string, string>)[`name_${user.theme}`] ?? user.theme : null
  const groups = user.groups ?? []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <section aria-labelledby="public-user-preferences" className="bg-bg-card rounded-xl p-4 flex flex-col gap-4">
        <h2 id="public-user-preferences" className="text-[10px] uppercase tracking-widest text-text-secondary">
          {T.userProfile.preferences}
        </h2>
        <dl className="flex flex-col gap-3">
          {themeName && (
            <Fact icon={<IconPalette size={18} />} label={T.userTheme.theme}>
              {themeName}
            </Fact>
          )}
          {user.gender && (
            <Fact icon={<IconGenderBigender size={18} />} label={T.userData.gender}>
              {T.userData[GENDER_KEYS[user.gender]]}
            </Fact>
          )}
        </dl>

        <h3 className="text-[10px] uppercase tracking-widest text-text-secondary pt-1">{T.userProfile.favoriteGames}</h3>
        {favorites.length === 0 ? (
          <p className="text-xs text-text-secondary italic">{T.userProfile.noFavorites}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {favorites.map(({ source, game }) => {
              const icon = candidateIconUrl({ source, imageRef: game!.imageIcon })
              return (
                <li key={source}>
                  <Link
                    href={gameHref(source, game!.id, subject)}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-bg-main hover:bg-ink/10 transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {icon ? (
                      <Image src={icon} alt="" width={36} height={36} className="w-9 h-9 rounded-lg object-cover shrink-0" unoptimized />
                    ) : (
                      <span aria-hidden="true" className="w-9 h-9 rounded-lg bg-ink/10 shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate flex-1">{game!.title}</span>
                    <span className="shrink-0">{PLATFORM_ICONS[source]}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="public-user-groups" className="bg-bg-card rounded-xl p-4 flex flex-col gap-3 lg:col-span-2">
        <h2 id="public-user-groups" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-secondary">
          <IconFolders size={14} aria-hidden="true" />
          {T.userProfile.publicGroups}
        </h2>
        {groups.length === 0 ? (
          <EmptyState icon={<IconFolders className="w-6 h-6" />} title={T.userProfile.noGroups} subtitle={T.userProfile.noGroupsHint} className="py-8" />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups.map((g) => (
              <li key={g.id}>
                <GroupCard group={g} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
