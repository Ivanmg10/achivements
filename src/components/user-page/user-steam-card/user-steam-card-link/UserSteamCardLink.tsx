'use client'

import { useLanguage } from '@/context/LanguageContext'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { CONNECT_CLASS } from '@/components/user-page/user-platform-card/UserPlatformCard'

/**
 * Connect Steam: a plain link to /api/auth/steam?intent=link, which leaves for
 * Steam's sign-in and comes back to this page linked (or saying why not).
 */
export default function UserSteamCardLink({ href }: { href: string }) {
  const { T } = useLanguage()

  return (
    // A route handler that redirects off-site, not a page: <Link> would try a client navigation.
    <a href={href} className={CONNECT_CLASS}>
      <SteamLogo size={16} aria-hidden="true" />
      {T.userData.steamConnect}
    </a>
  )
}
