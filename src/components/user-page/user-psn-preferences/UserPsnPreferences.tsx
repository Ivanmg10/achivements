'use client'

import { IconEyeOff, IconTrophy } from '@tabler/icons-react'
import PsnPreferenceSwitch from './psn-preference-switch/PsnPreferenceSwitch'
import UserConsolesPreference from '@/components/user-page/user-consoles-preference/UserConsolesPreference'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnPlatinumCompletes } from '@/hooks/usePsnPlatinumCompletes'
import { usePsnRevealHidden } from '@/hooks/usePsnRevealHidden'

/** The PlayStation tab's own choices: two switches and the consoles to show, saved in this browser. */
export default function UserPsnPreferences() {
  const { T } = useLanguage()
  const [platinum, setPlatinum] = usePsnPlatinumCompletes()
  const [reveal, setReveal] = usePsnRevealHidden()
  const { consoles } = usePsnGamesData()

  return (
    <>
      <PsnPreferenceSwitch
        icon={<IconTrophy size={18} />}
        label={T.userData.psnPlatinum}
        onText={T.userData.psnPlatinumOn}
        offText={T.userData.psnPlatinumOff}
        checked={platinum}
        onChange={setPlatinum}
      />
      <PsnPreferenceSwitch
        icon={<IconEyeOff size={18} />}
        label={T.userData.psnHiddenTrophies}
        onText={T.userData.psnHiddenReveal}
        offText={T.userData.psnHiddenConceal}
        checked={reveal}
        onChange={setReveal}
      />
      <UserConsolesPreference source="psn" consoles={consoles} />
    </>
  )
}
