'use client'

import { usePsnLink } from '@/hooks/usePsnLink'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { countTrophies, totalPlaytime } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import UserPlatformCard, { platformStat, PlatformStat } from '@/components/user-page/user-platform-card/UserPlatformCard'
import UserPlatformLinkForm from '@/components/user-page/user-platform-link-form/UserPlatformLinkForm'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'

/**
 * PlayStation Network on the account page. Linked by typing an online ID —
 * nothing proves it is yours, it only has to exist and show its trophies.
 */
export default function UserPsnCard() {
  const { T, lang } = useLanguage()
  const { accountId, username, isLinked, link, isLinking, error: linkError, unlink } = usePsnLink()
  const { summary, isLoading, error: summaryError } = usePsnSummary()
  const { library, libraryLoading } = usePsnGamesData()
  const minutes = totalPlaytime(library)
  const onlineId = summary?.onlineId || username

  const earned = summary?.earned
  const summaryOpts = { lang, loading: isLoading }
  const stats: PlatformStat[] = [
    platformStat(T.psn.level, summary?.trophyLevel, summaryOpts),
    platformStat(T.userStats.games, summary?.games, summaryOpts),
    platformStat(T.psn.platinum, earned?.platinum, { ...summaryOpts, tone: 'platinum' }),
    platformStat(T.steam.playtime, formatPlaytime(minutes, T.steam, lang), { lang, loading: libraryLoading }),
    platformStat(T.psn.trophies, earned ? countTrophies(earned) : undefined, summaryOpts),
  ]

  const handleLink = async (name: string) => {
    if (await link(name)) notify.success(T.toast.psnLinked)
  }

  return (
    <UserPlatformCard
      name="PlayStation Network"
      source="psn"
      href={onlineId ? `https://profile.playstation.com/${encodeURIComponent(onlineId)}` : undefined}
      logo={<PlaystationLogo size={18} className="text-psn" aria-hidden="true" />}
      bigLogo={<PlaystationLogo size={40} className="text-psn" aria-hidden="true" />}
      gradient="from-psn via-psn/40 to-psn-dark"
      connected={isLinked}
      hint={T.psn.connectHint}
      status={
        isLinked &&
        summaryError && (
          <p role="alert" className="text-xs text-danger">
            {T.psn.errors[summaryError]}
          </p>
        )
      }
      identity={{
        avatar: summary?.avatarUrl,
        fallback: <PlaystationLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />,
        name: onlineId || '—',
        id: accountId,
      }}
      stats={isLinked ? stats : []}
      disconnect={{ label: T.psn.disconnect, busyLabel: T.psn.disconnecting, run: unlink, done: T.toast.psnUnlinked }}
      action={
        <UserPlatformLinkForm
          id="psn-online-id"
          label={T.psn.usernameLabel}
          placeholder={T.psn.usernamePlaceholder}
          maxLength={16}
          logo={<PlaystationLogo size={16} aria-hidden="true" />}
          connect={T.psn.connect}
          connecting={T.psn.connecting}
          onSubmit={handleLink}
          isLinking={isLinking}
          error={linkError && T.psn.errors[linkError]}
        />
      }
    />
  )
}
