'use client'

import { IconUserCheck, IconUserPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useFollow } from '@/hooks/useFollow'

/** Follow or unfollow this user; the state is in the words and aria-pressed, not only the colour. */
export default function PublicUserFollowButton({ username, initial }: { username: string; initial: boolean }) {
  const { T } = useLanguage()
  const { following, pending, toggle } = useFollow(username, initial)
  const Icon = following ? IconUserCheck : IconUserPlus

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-tile font-semibold transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        following ? 'bg-bg-main text-text-main ring-1 ring-ink/10 hover:bg-ink/10' : 'bg-bg-main text-accent hover:bg-ink/10'
      }`}
    >
      <Icon size={13} aria-hidden="true" />
      {following ? T.following.following : T.following.follow}
    </button>
  )
}
