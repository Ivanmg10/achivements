'use client'

import { IconEyeOff } from '@tabler/icons-react'
import UserConsolesPreference from '@/components/user-page/user-consoles-preference/UserConsolesPreference'
import PsnPreferenceSwitch from '@/components/user-page/user-psn-preferences/psn-preference-switch/PsnPreferenceSwitch'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { useXboxRevealSecrets } from '@/hooks/useXboxRevealSecrets'

/**
 * The Xbox tab's own choices: one switch and the consoles to show, saved in
 * this browser. Shown only to who may use Xbox (an admin, for now).
 */
export default function UserXboxPreferences() {
  const { T } = useLanguage()
  const enabled = useXboxEnabled()
  const [reveal, setReveal] = useXboxRevealSecrets()
  const { consoles } = useXboxGamesData()

  if (!enabled) return null

  return (
    <>
      <PsnPreferenceSwitch
        icon={<IconEyeOff size={18} />}
        label={T.userData.xboxSecretAchievements}
        onText={T.userData.xboxSecretReveal}
        offText={T.userData.xboxSecretConceal}
        checked={reveal}
        onChange={setReveal}
      />
      <UserConsolesPreference source="xbox" consoles={consoles} />
    </>
  )
}
