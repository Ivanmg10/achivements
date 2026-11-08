import type { UserSearchResult } from '@/hooks/useUserSearch'
import { codeToFlag, findCountry } from '@/utils/countries'
import { PLATFORM_NAME, GAME_SOURCES } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import PresenceLabel from '@/components/presence-label/PresenceLabel'
import Avatar from '@/components/ui/Avatar'

/**
 * A CheevoVault user in one line, from our own data: picture (with a dot while
 * online), name, country, whether they are online or when they were last seen
 * (if they share it; else the start of their bio) and the platforms they play on. The caller wraps it
 * in whatever opens their profile.
 */
export default function UserSummary({ user, size = 36 }: { user: UserSearchResult; size?: number }) {
  const country = user.location ? findCountry(user.location) : null
  const platforms = GAME_SOURCES.filter((p) => user[p])

  return (
    <>
      <Avatar src={user.avatar} name={user.username} size={size} fallback="icon" online={user.online} />
      <span className="flex flex-col min-w-0 flex-1">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-sm font-medium text-text-main">{user.username}</span>
          {country && (
            <span className="text-sm leading-none" role="img" aria-label={country.name}>
              {codeToFlag(country.code)}
            </span>
          )}
        </span>
        <PresenceLabel
          online={user.online}
          lastSeenAt={user.lastSeenAt}
          playing={user.playing}
          fallback={user.description && <span className="text-xs text-text-secondary truncate">{user.description}</span>}
        />
      </span>
      {platforms.length > 0 && (
        <span className="flex items-center gap-1.5 shrink-0">
          {platforms.map((p) => (
            <PlatformLogo key={p} source={p} size={12} label={PLATFORM_NAME[p]} />
          ))}
        </span>
      )}
    </>
  )
}
