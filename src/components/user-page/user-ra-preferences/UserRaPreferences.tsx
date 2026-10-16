'use client'

import RaLogo from '@/components/ra-logo/RaLogo'
import UserConsolesPreference from '@/components/user-page/user-consoles-preference/UserConsolesPreference'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'

/** The RetroAchievements preferences, under the general ones: which of the consoles in the library show. Nothing, with fewer than two. */
export default function UserRaPreferences() {
  const { T } = useLanguage()
  const { consoles } = useGamesData()

  if (consoles.length < 2) return null

  return (
    <section aria-labelledby="ra-preferences" className="bg-bg-main rounded-2xl p-3 sm:p-4 flex flex-col gap-1">
      <h3 id="ra-preferences" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary px-1 pb-1">
        <RaLogo height={11} />
        {T.userData.raSection}
      </h3>
      <UserConsolesPreference source="ra" consoles={consoles} />
    </section>
  )
}
