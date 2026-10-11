'use client'

import { IconEyeOff, IconTrophy } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import PsnPreferenceSwitch from './psn-preference-switch/PsnPreferenceSwitch'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnPlatinumCompletes } from '@/hooks/usePsnPlatinumCompletes'
import { usePsnRevealHidden } from '@/hooks/usePsnRevealHidden'

/** The PlayStation preferences, under the general ones: two switches, saved in this browser. */
export default function UserPsnPreferences() {
  const { T } = useLanguage()
  const [platinum, setPlatinum] = usePsnPlatinumCompletes()
  const [reveal, setReveal] = usePsnRevealHidden()

  return (
    <section aria-labelledby="psn-preferences" className="bg-bg-main rounded-2xl p-3 sm:p-4 flex flex-col gap-1">
      <h3 id="psn-preferences" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary px-1 pb-1">
        <PlaystationLogo size={16} className="text-[#0070d1]" aria-hidden="true" />
        {T.userData.psnSection}
      </h3>
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
    </section>
  )
}
