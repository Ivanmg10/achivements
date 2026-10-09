'use client'

import Image from 'next/image'
import { usePsnLink } from '@/hooks/usePsnLink'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { countTrophies, totalPlaytime } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import UserPlatformCard, {
  DISCONNECT_CLASS,
  PlatformStat,
} from '@/components/user-page/user-platform-card/UserPlatformCard'
import UserPsnCardForm from '@/components/user-page/user-psn-card/user-psn-card-form/UserPsnCardForm'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'

/**
 * PlayStation Network on the account page. Linked by typing an online ID —
 * nothing proves it is yours, it only has to exist and show its trophies.
 */
export default function UserPsnCard() {
  const { T, lang } = useLanguage()
  const { accountId, username, isLinked, link, isLinking, error: linkError, unlink, isUnlinking } = usePsnLink()
  const { summary, isLoading, error: summaryError } = usePsnSummary()
  const { library, libraryLoading } = usePsnGamesData()
  const minutes = totalPlaytime(library)
  const onlineId = summary?.onlineId || username

  const value = (n: number | undefined) => (isLoading || n === undefined ? '—' : n.toLocaleString())
  const earned = summary?.earned
  const stats: PlatformStat[] = [
    { label: T.psn.level, value: value(summary?.trophyLevel), accent: 'text-[#0070d1]' },
    { label: T.userStats.games, value: value(summary?.games) },
    { label: T.psn.platinum, value: value(earned?.platinum), accent: 'text-sky-300' },
    {
      label: T.steam.playtime,
      value: libraryLoading ? '—' : formatPlaytime(minutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang),
    },
    {
      label: T.psn.trophies,
      value: value(earned ? countTrophies(earned) : undefined),
    },
  ]

  const handleLink = async (name: string) => {
    if (await link(name)) notify.success(T.toast.psnLinked)
  }

  const handleUnlink = async () => {
    if (await unlink()) notify.success(T.toast.psnUnlinked)
    else notify.error(T.toast.unlinkFailed)
  }

  return (
    <UserPlatformCard
      name="PlayStation Network"
      href={onlineId ? `https://profile.playstation.com/${encodeURIComponent(onlineId)}` : undefined}
      logo={<PlaystationLogo size={18} className="text-[#0070d1]" aria-hidden="true" />}
      bigLogo={<PlaystationLogo size={40} className="text-[#0070d1]" aria-hidden="true" />}
      gradient="from-[#0070d1] via-[#0070d1]/40 to-[#003791]"
      connected={isLinked}
      hint={T.psn.connectHint}
      status={
        isLinked &&
        summaryError && (
          <p role="alert" className="text-xs text-red-400">
            {T.psn.errors[summaryError]}
          </p>
        )
      }
      identity={
        <div className="flex items-center gap-3 min-w-0">
          {summary?.avatarUrl ? (
            <Image
              src={summary.avatarUrl}
              alt=""
              width={44}
              height={44}
              className="rounded-lg w-11 h-11 object-cover shrink-0"
              unoptimized
            />
          ) : (
            <PlaystationLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-bold truncate">{summary?.onlineId || username || '—'}</span>
            <span className="text-xs text-text-secondary font-mono truncate">{accountId}</span>
          </div>
        </div>
      }
      stats={isLinked ? stats : []}
      action={
        isLinked ? (
          <button onClick={handleUnlink} disabled={isUnlinking} className={DISCONNECT_CLASS}>
            {isUnlinking ? T.psn.disconnecting : T.psn.disconnect}
          </button>
        ) : (
          <UserPsnCardForm onSubmit={handleLink} isLinking={isLinking} error={linkError} />
        )
      }
    />
  )
}
