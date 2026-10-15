'use client'

import Image from 'next/image'
import { useXboxLink } from '@/hooks/useXboxLink'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import { xboxHasAchievements } from '@/utils/xboxTitles'
import UserPlatformCard, {
  DISCONNECT_CLASS,
  PlatformStat,
} from '@/components/user-page/user-platform-card/UserPlatformCard'
import UserXboxCardForm from '@/components/user-page/user-xbox-card/user-xbox-card-form/UserXboxCardForm'
import XboxLogo from '@/components/xbox-logo/XboxLogo'

/**
 * Xbox on the account page. Linked by typing a gamertag — nothing proves it is
 * yours, it only has to exist and show its games. Only an admin sees it, while
 * Xbox is admin-only; to anyone else this renders nothing at all.
 */
export default function UserXboxCard() {
  const { T } = useLanguage()
  const { enabled, xuid, gamertag, isLinked, link, isLinking, error: linkError, unlink, isUnlinking } = useXboxLink()
  const { summary, isLoading, error: summaryError } = useXboxSummary()
  const { library } = useXboxGamesData()

  if (!enabled) return null

  const name = summary?.gamertag || gamertag
  const value = (n: number | undefined) => (isLoading || n === undefined ? '—' : n.toLocaleString())
  const stats: PlatformStat[] = [
    { label: T.xbox.gamerscore, value: value(summary?.gamerscore), accent: 'text-green-500' },
    { label: T.userStats.games, value: value(summary?.games) },
    { label: T.xbox.achievements, value: value(summary?.achievementsUnlocked) },
    { label: T.xbox.tier, value: isLoading ? '—' : summary?.tier || '—' },
    { label: T.userStats.inProgress, value: value(library.filter((g) => xboxHasAchievements(g) && g.pctWon > 0 && g.pctWon < 100).length) },
  ]

  const handleLink = async (tag: string) => {
    if (await link(tag)) notify.success(T.toast.xboxLinked)
  }

  const handleUnlink = async () => {
    if (await unlink()) notify.success(T.toast.xboxUnlinked)
    else notify.error(T.toast.unlinkFailed)
  }

  return (
    <UserPlatformCard
      name="Xbox"
      href={name ? `https://www.xbox.com/play/user/${encodeURIComponent(name)}` : undefined}
      logo={<XboxLogo size={18} className="text-[#107c10]" aria-hidden="true" />}
      bigLogo={<XboxLogo size={40} className="text-[#107c10]" aria-hidden="true" />}
      gradient="from-[#107c10] via-[#107c10]/40 to-[#0b4d0b]"
      connected={isLinked}
      hint={T.xbox.connectHint}
      status={
        isLinked &&
        summaryError && (
          <p role="alert" className="text-xs text-red-400">
            {T.xbox.errors[summaryError]}
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
            <XboxLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-bold truncate">{name || '—'}</span>
            <span className="text-xs text-text-secondary font-mono truncate">{xuid}</span>
            <span className="text-[10px] text-text-secondary">{T.xbox.adminOnly}</span>
          </div>
        </div>
      }
      stats={isLinked ? stats : []}
      action={
        isLinked ? (
          <button onClick={handleUnlink} disabled={isUnlinking} className={DISCONNECT_CLASS}>
            {isUnlinking ? T.xbox.disconnecting : T.xbox.disconnect}
          </button>
        ) : (
          <UserXboxCardForm onSubmit={handleLink} isLinking={isLinking} error={linkError} />
        )
      }
    />
  )
}
