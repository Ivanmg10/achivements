'use client'

import { useXboxLink } from '@/hooks/useXboxLink'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { formatPlaytime } from '@/utils/steamFeed'
import { totalXboxPlaytime } from '@/utils/xboxTitles'
import UserPlatformCard, { platformStat, PlatformStat } from '@/components/user-page/user-platform-card/UserPlatformCard'
import UserPlatformLinkForm from '@/components/user-page/user-platform-link-form/UserPlatformLinkForm'
import XboxLogo from '@/components/xbox-logo/XboxLogo'

/**
 * Xbox on the account page. Linked by typing a gamertag — nothing proves it is
 * yours, it only has to exist and show its games. Only an admin sees it, while
 * Xbox is admin-only; to anyone else this renders nothing at all.
 */
export default function UserXboxCard() {
  const { T, lang } = useLanguage()
  const { enabled, xuid, gamertag, isLinked, link, isLinking, error: linkError, unlink } = useXboxLink()
  const { summary, isLoading, error: summaryError } = useXboxSummary()
  const { library, libraryLoading } = useXboxGamesData()

  if (!enabled) return null

  const name = summary?.gamertag || gamertag
  const summaryOpts = { lang, loading: isLoading }
  const minutes = totalXboxPlaytime(library)
  const stats: PlatformStat[] = [
    platformStat(T.xbox.gamerscore, summary?.gamerscore, { ...summaryOpts, tone: 'success' }),
    platformStat(T.userStats.games, summary?.games, summaryOpts),
    platformStat(T.userStats.achievements, summary?.achievementsUnlocked, summaryOpts),
    platformStat(T.xbox.tier, summary?.tier, summaryOpts),
    // No play time reads as absent, not as "0 min".
    platformStat(T.steam.playtime, minutes === 0 ? null : formatPlaytime(minutes, T.steam, lang), { lang, loading: libraryLoading }),
  ]

  const handleLink = async (tag: string) => {
    if (await link(tag)) notify.success(T.toast.xboxLinked)
  }

  return (
    <UserPlatformCard
      name="Xbox"
      source="xbox"
      href={name ? `https://www.xbox.com/play/user/${encodeURIComponent(name)}` : undefined}
      logo={<XboxLogo size={18} className="text-xbox" aria-hidden="true" />}
      bigLogo={<XboxLogo size={40} className="text-xbox" aria-hidden="true" />}
      gradient="from-xbox via-xbox/40 to-xbox-dark"
      connected={isLinked}
      hint={T.xbox.connectHint}
      status={
        isLinked &&
        summaryError && (
          <p role="alert" className="text-xs text-danger">
            {T.xbox.errors[summaryError]}
          </p>
        )
      }
      identity={{
        avatar: summary?.avatarUrl,
        fallback: <XboxLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />,
        name: name || '—',
        id: xuid,
        note: T.xbox.adminOnly,
      }}
      stats={isLinked ? stats : []}
      disconnect={{ label: T.xbox.disconnect, busyLabel: T.xbox.disconnecting, run: unlink, done: T.toast.xboxUnlinked }}
      action={
        <UserPlatformLinkForm
          id="xbox-gamertag"
          label={T.xbox.gamertagLabel}
          placeholder={T.xbox.gamertagPlaceholder}
          maxLength={20}
          logo={<XboxLogo size={16} aria-hidden="true" />}
          connect={T.xbox.connect}
          connecting={T.xbox.connecting}
          onSubmit={handleLink}
          isLinking={isLinking}
          error={linkError && T.xbox.errors[linkError]}
        />
      }
    />
  )
}
