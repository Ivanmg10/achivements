'use client'

import Image from 'next/image'
import { IconUser, IconUsers } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { FriendOverview } from '@/utils/friends'
import PresenceDot from '@/components/presence-dot/PresenceDot'
import { Skeleton } from '@/components/ui/Skeleton'

const STACK_MAX = 5

/**
 * The top of the Following page: a wash of the theme's accent, the title with
 * its icon and line at the top left, and, once the list is in, how many people
 * you follow (in the display face) with a few of their faces and how many of
 * them are online now, at the bottom.
 */
export default function FollowingHero({ users, isLoading = false, className = '' }: { users: FriendOverview[]; isLoading?: boolean; className?: string }) {
  const { T, lang } = useLanguage()
  const stack = users.slice(0, STACK_MAX)
  const more = users.length - stack.length
  const online = users.filter((u) => u.online).length

  return (
    <section
      aria-labelledby="following-title"
      className={`relative rounded-card overflow-hidden ring-1 ring-inset ring-ink/[0.06] ${className}`}
      style={{ background: 'radial-gradient(ellipse at top left, rgb(var(--accent) / 0.25), transparent 60%), rgb(var(--bg-card))' }}
    >
      <IconUsers aria-hidden="true" size={220} stroke={1} className="hidden sm:block absolute -right-10 -bottom-16 text-accent/10 pointer-events-none" />

      <div className="relative px-4 sm:px-7 py-6 sm:py-7 flex flex-col gap-6 h-full justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <span aria-hidden="true" className="w-14 h-14 rounded-card bg-accent/15 text-accent ring-1 ring-accent/25 flex items-center justify-center shrink-0">
            <IconUsers size={26} />
          </span>
          <div className="min-w-0">
            <h1 id="following-title" className="font-display italic font-extrabold text-5xl sm:text-[4rem] leading-[0.9] pr-2">{T.following.title}</h1>
            <p className="mt-1.5 text-[0.9375rem] text-text-secondary">{T.following.tagline}</p>
          </div>
        </div>

        {/* Its room is kept while the list is read, so the page below does not move when it comes. */}
        {isLoading && (
          <div aria-hidden="true" className="flex items-end gap-5 min-h-[6.5rem] sm:min-h-0">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-11 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex pb-0.5 pl-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} radius="circle" className="w-9 h-9 -ml-2 ring-[3px] ring-bg-card" />
              ))}
            </div>
          </div>
        )}
        {users.length > 0 && (
          <div className="flex items-end gap-x-5 gap-y-3 flex-wrap">
            <p className="flex flex-col">
              <span className="font-display italic font-extrabold text-[3.25rem] leading-[0.85] tabular-nums pr-1">{users.length.toLocaleString(lang)}</span>
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-text-secondary mt-1.5">{T.following.people}</span>
            </p>
            <div aria-hidden="true" className="flex items-center pb-0.5 pl-2">
              {stack.map((u) => (
                <span key={u.username} className="relative -ml-2">
                  {u.avatar ? (
                    <Image src={u.avatar} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover ring-[3px] ring-bg-card" unoptimized />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-bg-main ring-[3px] ring-bg-card flex items-center justify-center">
                      <IconUser size={14} className="text-text-secondary" />
                    </span>
                  )}
                  <PresenceDot online={u.online} size="xs" />
                </span>
              ))}
              {more > 0 && (
                <span className="ml-1.5 h-9 px-2 rounded-[0.5rem] bg-ink/[0.08] text-xs font-bold text-text-secondary flex items-center tabular-nums">
                  +{more.toLocaleString(lang)}
                </span>
              )}
            </div>
            {online > 0 && (
              <p className="flex items-center gap-1.5 pb-1.5 text-[0.8125rem] font-bold text-success">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-success" />
                {T.following.onlineNow.replace('{n}', online.toLocaleString(lang))}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
