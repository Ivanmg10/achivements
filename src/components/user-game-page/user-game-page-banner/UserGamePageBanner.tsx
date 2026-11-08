'use client'

import Link from 'next/link'
import { IconArrowLeft, IconArrowsDiff, IconExternalLink } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { CheevoUser } from '@/hooks/useCheevoUser'
import Avatar from '@/components/ui/Avatar'

/**
 * Whose progress this is, with the way back to their profile; the game's own
 * page (yours); and the switch that sets your progress beside theirs.
 */
export default function UserGamePageBanner({
  user,
  gamePageHref,
  comparing,
  onToggleCompare,
}: {
  user: CheevoUser
  gamePageHref: string
  comparing: boolean
  /** Absent on your own page: there is nobody to compare with. */
  onToggleCompare?: () => void
}) {
  const { T } = useLanguage()
  const action = 'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-tile transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

  return (
    <div className="relative z-10 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)] mt-4 flex flex-wrap items-center justify-between gap-3 bg-bg-card/85 backdrop-blur rounded-tile px-3 py-2 ring-1 ring-ink/5">
      <Link
        href={`/user/${encodeURIComponent(user.username)}#games`}
        className="flex items-center gap-2 min-w-0 rounded-box pr-2 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <IconArrowLeft size={16} className="shrink-0" aria-hidden="true" />
        <Avatar src={user.avatar} name={user.username} size={28} fallback="icon" online={user.isSelf ? undefined : user.online} announce />
        <span className="text-sm font-medium truncate">{T.userGame.progressOf.replace('{u}', user.username)}</span>
      </Link>

      <div className="flex items-center gap-2 flex-wrap">
        <Link href={gamePageHref} className={`${action} bg-bg-main text-text-secondary hover:text-text-main`}>
          <IconExternalLink size={13} aria-hidden="true" />
          {T.userGame.openGamePage}
        </Link>
        {onToggleCompare && (
          <button
            type="button"
            aria-pressed={comparing}
            onClick={onToggleCompare}
            className={`${action} font-semibold ${comparing ? 'bg-accent text-bg-main' : 'bg-accent/15 text-accent hover:bg-accent/25'}`}
          >
            <IconArrowsDiff size={13} aria-hidden="true" />
            {T.userProfile.compareWithMe}
          </button>
        )}
      </div>
    </div>
  )
}
