'use client'

import type { ReactNode } from 'react'
import { IconExternalLink } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { CheevoUser } from '@/hooks/useCheevoUser'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'

const CHIP = 'flex items-center gap-1.5 rounded-full bg-bg-main/80 ring-1 ring-ink/[0.06] px-2.5 py-1 text-xs font-medium min-w-0'

function Chip({ icon, name, href, opens }: { icon: ReactNode; name: string; href?: string; opens: string }) {
  if (!href) {
    return (
      <li className={CHIP}>
        {icon}
        <span className="truncate">{name}</span>
      </li>
    )
  }
  return (
    <li className="min-w-0">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${name} — ${opens}`}
        className={`${CHIP} hover:bg-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
      >
        {icon}
        <span className="truncate">{name}</span>
        <IconExternalLink size={11} className="shrink-0 text-text-secondary" aria-hidden="true" />
      </a>
    </li>
  )
}

/**
 * The accounts a user has linked, each with their name on it. RA's opens
 * their RA profile; Steam and PSN are named only — their ids stay with us.
 */
export default function PublicUserPlatformChips({ user }: { user: CheevoUser }) {
  const { T } = useLanguage()
  if (!user.ra && !user.steam && !user.psn) return null

  return (
    <ul aria-label={T.userProfile.platformsLabel} className="flex flex-wrap gap-1.5">
      {user.ra && (
        <Chip
          icon={<RaLogo height={10} />}
          name={user.ra}
          href={`https://retroachievements.org/user/${encodeURIComponent(user.ra)}`}
          opens={T.userProfile.openOnRa}
        />
      )}
      {user.steam && (
        <Chip icon={<SteamLogo size={13} className="text-[#66c0f4] shrink-0" aria-hidden="true" />} name={user.steamName || 'Steam'} opens="" />
      )}
      {user.psn && (
        <Chip icon={<PlaystationLogo size={13} className="text-[#0070d1] shrink-0" aria-hidden="true" />} name={user.psnName || 'PlayStation'} opens="" />
      )}
    </ul>
  )
}
