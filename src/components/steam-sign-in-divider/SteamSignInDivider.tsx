'use client'

import { useLanguage } from '@/context/LanguageContext'
import SteamSignInButton from '@/components/steam-sign-in-button/SteamSignInButton'

/** The "or" line and the Steam button, under the sign-in and register forms. */
export default function SteamSignInDivider() {
  const { T } = useLanguage()

  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span aria-hidden="true" className="h-px flex-1 bg-ink/10" />
        {T.steamAuth.or}
        <span aria-hidden="true" className="h-px flex-1 bg-ink/10" />
      </div>
      <SteamSignInButton />
    </div>
  )
}
