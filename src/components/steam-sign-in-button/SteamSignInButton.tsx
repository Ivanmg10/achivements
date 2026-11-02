'use client'

import { IconBrandSteam } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * "Continue with Steam": a plain link, since it leaves for Steam's own sign-in
 * page (/api/auth/steam redirects there) and comes back to /authPage?steam=…
 */
export default function SteamSignInButton({ label }: { label?: string }) {
  const { T } = useLanguage()

  return (
    // A route handler that redirects off-site, not a page: <Link> would try a client navigation.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      href="/api/auth/steam"
      className="w-full py-3 rounded-tile font-semibold flex items-center justify-center gap-2 bg-[#171a21] text-white border border-white/10 hover:bg-[#2a475e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main"
    >
      <IconBrandSteam size={18} aria-hidden="true" />
      {label ?? T.steamAuth.continue}
    </a>
  )
}
