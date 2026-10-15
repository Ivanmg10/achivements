'use client'

import { IconEyeOff } from '@tabler/icons-react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import PsnPreferenceSwitch from '@/components/user-page/user-psn-preferences/psn-preference-switch/PsnPreferenceSwitch'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { useXboxRevealSecrets } from '@/hooks/useXboxRevealSecrets'

/**
 * The Xbox preferences, under the PlayStation ones: one switch, saved in this
 * browser. Shown only to who may use Xbox (an admin, for now).
 */
export default function UserXboxPreferences() {
  const { T } = useLanguage()
  const enabled = useXboxEnabled()
  const [reveal, setReveal] = useXboxRevealSecrets()

  if (!enabled) return null

  return (
    <section aria-labelledby="xbox-preferences" className="bg-bg-main rounded-2xl p-3 sm:p-4 flex flex-col gap-1">
      <h3 id="xbox-preferences" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary px-1 pb-1">
        <XboxLogo size={16} className="text-[#107c10]" aria-hidden="true" />
        {T.userData.xboxSection}
      </h3>
      <PsnPreferenceSwitch
        icon={<IconEyeOff size={18} />}
        label={T.userData.xboxSecretAchievements}
        onText={T.userData.xboxSecretReveal}
        offText={T.userData.xboxSecretConceal}
        checked={reveal}
        onChange={setReveal}
      />
    </section>
  )
}
