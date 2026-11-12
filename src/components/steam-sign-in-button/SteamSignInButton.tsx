'use client'

import SteamLogo from '@/components/steam-logo/SteamLogo'
import { buttonClass } from '@/components/ui/Button'
import { useLanguage } from '@/context/LanguageContext'

const SECONDARY = buttonClass('secondary', 'lg', 'w-full')

/**
 * "Continue with Steam": the library's secondary button with Steam's mark, as a
 * plain link, since it leaves for Steam's own sign-in page (/api/auth/steam
 * redirects there) and comes back to /authPage?steam=…
 */
export default function SteamSignInButton({ label }: { label?: string }) {
  const { T } = useLanguage()

  return (
    // A route handler that redirects off-site, not a page: `Button href` is a <Link>, which would try a client navigation.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/api/auth/steam" className={SECONDARY}>
      <SteamLogo size={18} className="text-steam" />
      {label ?? T.steamAuth.continue}
    </a>
  )
}
