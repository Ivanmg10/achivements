'use client'

import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'

const CHIP = 'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ring-1 font-medium'

/**
 * The name over the sign-in forms, the line that says what it is, and the
 * platforms it reads, each with its own mark. PlayStation is greyed and says
 * it is coming, in words as well as in tone.
 */
export default function AuthBrand() {
  const { T } = useLanguage()
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <p className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight">{T.authPage.brand}</p>
      <p className="text-sm text-text-secondary max-w-xs text-balance">{T.landing.tagline}</p>
      <ul className="flex flex-wrap items-center justify-center gap-2 mt-1">
        <li className={`${CHIP} bg-bg-card/70 text-text-main ring-white/10`}>
          <RaLogo height={11} />
          RetroAchievements
        </li>
        <li className={`${CHIP} bg-bg-card/70 text-text-main ring-white/10`}>
          <SteamLogo size={12} className="text-[#66c0f4]" aria-hidden="true" />
          Steam
        </li>
        <li className={`${CHIP} bg-bg-tertiary/50 text-text-secondary ring-white/5`}>
          <PlaystationLogo size={12} aria-hidden="true" />
          PlayStation · {T.userData.comingSoon.toLowerCase()}
        </li>
      </ul>
    </div>
  )
}
