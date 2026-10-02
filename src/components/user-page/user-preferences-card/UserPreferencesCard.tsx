'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { IconLanguage, IconPalette } from '@tabler/icons-react'
import ProfileField from '@/components/user-page/profile-field/ProfileField'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import FavoriteGameModal, { FavoriteGame } from '@/components/favorite-game-modal/FavoriteGameModal'
import LanguageModal from '@/components/language-modal/LanguageModal'
import ThemeModal from '@/components/theme-modal/ThemeModal'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { candidateIconUrl } from '@/utils/gameCandidates'
import type { GameSource } from '@/types/steam'
import { notify } from '@/lib/notify'

/** Saves the favourite game for one platform and refreshes the session. */
async function saveFavorite(source: GameSource, game: FavoriteGame | null) {
  const res = game
    ? await fetch('/api/updateFavoriteGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...game, source }),
      })
    : await fetch(`/api/updateFavoriteGame?source=${source}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Saving the favourite game failed (${res.status})`)
}

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
 * How the app looks and what the user calls their own: theme, language and
 * a favourite game per platform. Each line opens the picker it belongs to;
 * nothing here is typed in directly.
 */
export default function UserPreferencesCard() {
  const { data: session, update } = useSession()
  const { lang, T } = useLanguage()
  const { theme } = useTheme()
  const [themeOpen, setThemeOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [favoriteOpen, setFavoriteOpen] = useState<GameSource | null>(null)

  const user = session?.user
  const raFavorite = user?.favorite_game ?? null
  const steamFavorite = user?.favorite_steam_game ?? null

  async function handleSave(source: GameSource, game: FavoriteGame | null) {
    await saveFavorite(source, game)
    await update()
    notify.success(T.toast.saved)
  }

  return (
    <section className="bg-bg-card rounded-3xl p-6 flex flex-col gap-5 h-full">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        {T.userPage.preferences}
      </h2>

      <div className="bg-bg-main rounded-2xl p-3 sm:p-4 flex flex-col gap-1 flex-1">
        <ProfileField label={T.userTheme.theme} icon={<IconPalette size={18} />} onEdit={() => setThemeOpen(true)}>
          <span className="flex items-center gap-2 min-w-0">
            <span aria-hidden="true" className="w-4 h-4 rounded-full bg-accent shrink-0" />
            <span className="text-base font-medium capitalize truncate">{theme}</span>
          </span>
        </ProfileField>

        <ProfileField label={T.userConfig.language} icon={<IconLanguage size={18} />} onEdit={() => setLangOpen(true)}>
          <span className="text-base font-medium uppercase">{lang}</span>
        </ProfileField>

        <ProfileField label={T.userPage.favoriteRaGame} icon={<RaLogo height={11} />} onEdit={() => setFavoriteOpen('ra')}>
          <FavoriteValue game={raFavorite} source="ra" empty={T.userData.notSet} />
        </ProfileField>

        <ProfileField label={T.userPage.favoriteSteamGame} icon={<SteamLogo size={18} className="text-[#66c0f4]" aria-hidden="true" />} onEdit={() => setFavoriteOpen('steam')}>
          <FavoriteValue game={steamFavorite} source="steam" empty={T.userData.notSet} />
        </ProfileField>
      </div>

      <ThemeModal isOpen={themeOpen} onClose={() => setThemeOpen(false)} />
      <LanguageModal isOpen={langOpen} onClose={() => setLangOpen(false)} />
      <FavoriteGameModal
        isOpen={favoriteOpen !== null}
        source={favoriteOpen ?? 'ra'}
        current={favoriteOpen === 'steam' ? steamFavorite : raFavorite}
        onClose={() => setFavoriteOpen(null)}
        onSave={(game) => handleSave(favoriteOpen ?? 'ra', game)}
      />
    </section>
  )
}
