import type { GameGroup } from '@/types/types'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'

/** How many of a group's games come from each platform. */
export function platformCounts(group: GameGroup) {
  const psn = group.psn_count ?? 0
  const xbox = group.xbox_count ?? 0
  const steam = group.steam_count
  return { ra: group.game_count - steam - psn - xbox, steam, psn, xbox }
}

/**
 * The logos of the platforms a group's games come from. Named by `label`, or
 * by the platforms themselves.
 */
export default function GroupPlatformLogos({ group, label }: { group: GameGroup; label?: string }) {
  const n = platformCounts(group)
  const names = [n.ra > 0 && 'RetroAchievements', n.steam > 0 && 'Steam', n.psn > 0 && 'PlayStation', n.xbox > 0 && 'Xbox'].filter(Boolean)
  if (names.length === 0) return null

  return (
    <span className="flex items-center gap-1.5 shrink-0" role="img" aria-label={label ?? names.join(', ')}>
      {n.ra > 0 && <RaLogo height={11} className="opacity-70" />}
      {n.steam > 0 && <SteamLogo size={11} className="text-[#66c0f4]/80" />}
      {n.psn > 0 && <PlaystationLogo size={11} className="text-[#0070d1]" />}
      {n.xbox > 0 && <XboxLogo size={11} className="text-[#107c10]" />}
    </span>
  )
}
