import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import type { GameSource } from '@/types/steam'

/**
 * The small round platform mark in a game tile's corner: Steam's or
 * PlayStation's logo. RA has none (its tiles mark hardcore instead), so it
 * renders nothing. Decorative — the tile says the platform in words.
 */
export default function PlatformMark({ source, size = 11 }: { source: GameSource; size?: number }) {
  if (source === 'ra') return null
  return (
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-1 rounded-full bg-bg-card flex items-center justify-center"
      style={{ width: size + 5, height: size + 5 }}
    >
      {source === 'steam' ? (
        <SteamLogo size={size} className="text-[#66c0f4]" />
      ) : (
        <PlaystationLogo size={size} className="text-[#0070d1]" />
      )}
    </span>
  )
}
