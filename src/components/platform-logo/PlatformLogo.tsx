import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import type { GameSource } from '@/types/steam'

/**
 * A platform's logo in its own colour, at about `size` px. Decorative by
 * default — the text beside it names the platform; pass `label` when the
 * logo stands alone.
 */
export default function PlatformLogo({
  source,
  size = 12,
  label,
  className = '',
}: {
  source: GameSource
  size?: number
  label?: string
  className?: string
}) {
  if (source === 'steam') return <SteamLogo size={size} className={`text-[#66c0f4] ${className}`} aria-label={label} />
  if (source === 'psn') return <PlaystationLogo size={size} className={`text-[#0070d1] ${className}`} aria-label={label} />
  return (
    <span className={`inline-flex shrink-0 ${className}`} {...(label ? { role: 'img', 'aria-label': label } : {})}>
      <RaLogo height={Math.round(size * 0.85)} />
    </span>
  )
}
