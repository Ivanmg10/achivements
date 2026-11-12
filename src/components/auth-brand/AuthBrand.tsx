'use client'

import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import BrandMark from '@/components/ui/BrandMark'
import Facts from '@/components/ui/Facts'
import { useLanguage } from '@/context/LanguageContext'

const PLATFORM = 'inline-flex items-center gap-1.5'

/**
 * The logo and the name over the sign-in forms, the line that says what it is,
 * and the platforms it reads on one line, each with its own mark.
 */
export default function AuthBrand() {
  const { T } = useLanguage()
  return (
    <div className="flex flex-col items-center text-center gap-3 enter-rise">
      <BrandMark name={T.authPage.brand} size="lg" />
      <p className="text-sm text-text-secondary max-w-xs text-balance">{T.landing.tagline}</p>
      <p className="flex flex-wrap items-center justify-center text-xs font-medium text-text-main">
        <Facts
          items={[
            <span key="ra" className={PLATFORM}><RaLogo height={11} />RetroAchievements</span>,
            <span key="steam" className={PLATFORM}><SteamLogo size={12} className="text-steam" aria-hidden="true" />Steam</span>,
            <span key="psn" className={PLATFORM}><PlaystationLogo size={12} className="text-psn" aria-hidden="true" />PlayStation</span>,
          ]}
        />
      </p>
    </div>
  )
}
