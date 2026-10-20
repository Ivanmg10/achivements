'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import ProfileField from '@/components/user-page/profile-field/ProfileField'
import { useLanguage } from '@/context/LanguageContext'
import { candidateIconUrl } from '@/utils/gameCandidates'
import type { FavoriteGame } from '@/components/favorite-game-modal/FavoriteGameModal'
import type { GameSource } from '@/types/steam'

function FavoriteValue({ game, source, empty }: { game: FavoriteGame | null; source: GameSource; empty: string }) {
  if (!game) return <span className="text-base text-text-secondary italic truncate">{empty}</span>
  const icon = candidateIconUrl({ source, imageRef: game.imageIcon })
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      {icon && (
        <Image src={icon} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover shrink-0" unoptimized />
      )}
      <span className="text-base font-medium truncate">{game.title}</span>
    </span>
  )
}

/**
 * One platform's tab in the preferences: the favourite game first (the same
 * line for every platform), then whatever that platform lets you choose.
 */
export default function UserPreferencesPlatform({
  source,
  label,
  icon,
  favorite,
  onEditFavorite,
  children,
}: {
  source: GameSource
  /** "Favourite RA game", "Favourite Steam game"… */
  label: string
  icon: ReactNode
  favorite: FavoriteGame | null
  onEditFavorite: () => void
  /** The platform's own preferences. */
  children?: ReactNode
}) {
  const { T } = useLanguage()
  return (
    <div className="flex flex-col gap-1">
      <ProfileField label={label} icon={icon} onEdit={onEditFavorite}>
        <FavoriteValue game={favorite} source={source} empty={T.userData.notSet} />
      </ProfileField>
      {children}
    </div>
  )
}
