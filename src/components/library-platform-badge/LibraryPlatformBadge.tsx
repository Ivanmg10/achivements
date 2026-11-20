import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/game'
import Tag from '@/components/ui/Tag'

/**
 * The platform a game is from, with its logo and name. Small on a card; large
 * beside a game's name when it is the one open. In a list row it is a plain tag
 * that names the console (`label`: "GameCube", "PS4"; #169), with the
 * platform's logo, which a screen reader hears as the platform's name.
 */
export default function LibraryPlatformBadge({ source, size = 'sm', label }: { source: GameSource; size?: 'sm' | 'lg' | 'tag'; label?: string }) {
  if (size === 'tag') {
    const text = label || PLATFORM_NAME[source]
    // The logo names the platform aloud only when the text is a console. On a phone the name ate the game's
    // title: the logo says it there, the name stays for a screen reader.
    return (
      <span className="inline-flex shrink-0 items-center gap-1 h-[1.1875rem] px-1.5 rounded-badge text-[0.6875rem] font-bold whitespace-nowrap bg-ink/[0.07] text-text-secondary">
        <PlatformLogo source={source} size={11} label={text === PLATFORM_NAME[source] ? undefined : PLATFORM_NAME[source]} />
        <span className="max-sm:sr-only">{text}</span>
      </span>
    )
  }
  const large = size === 'lg'
  return (
    <Tag tone={large ? 'overlay' : 'surface'} size={large ? 'md' : 'xs'}>
      <PlatformLogo source={source} size={large ? 18 : 11} />
      {PLATFORM_NAME[source]}
    </Tag>
  )
}
