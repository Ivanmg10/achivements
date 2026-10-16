'use client'

import UserConsolesPreference from '@/components/user-page/user-consoles-preference/UserConsolesPreference'
import { useGamesData } from '@/context/GamesDataContext'

/** The RetroAchievements tab's own choices: which of the consoles in the library show. Nothing, with fewer than two. */
export default function UserRaPreferences() {
  const { consoles } = useGamesData()
  return <UserConsolesPreference source="ra" consoles={consoles} />
}
