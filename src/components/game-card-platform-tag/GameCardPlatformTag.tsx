import SteamLogo from '@/components/steam-logo/SteamLogo'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import Tag, { type TagTone } from '@/components/ui/Tag'

export const PLATFORM_LOGO = { steam: SteamLogo, psn: PlaystationLogo, xbox: XboxLogo }

/** The platform's chip on a game card: its logo and its name, or the console's. */
export default function GameCardPlatformTag({ source, tone, label }: { source: keyof typeof PLATFORM_LOGO; tone: TagTone; label: string }) {
  const Logo = PLATFORM_LOGO[source]
  return (
    <Tag size="xs" tone={tone}>
      <Logo size={12} aria-hidden="true" />
      {label}
    </Tag>
  )
}
