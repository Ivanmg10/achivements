'use client'

import Image from 'next/image'
import { IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { FriendOverview } from '@/utils/friends'
import PresenceDot from '@/components/presence-dot/PresenceDot'

const STACK_MAX = 5

/**
 * The top of the Following page: a wash of the theme's accent, the title, and
 * once the list is in, how many people you follow with a few of their faces,
 * and how many of them are online now.
 */
export default function FollowingHero({ users, className = '' }: { users: FriendOverview[]; className?: string }) {
  const { T, lang } = useLanguage()
  const stack = users.slice(0, STACK_MAX)
  const more = users.length - stack.length
  const online = users.filter((u) => u.online).length

  return (
    <section
      aria-labelledby="following-title"
      className={`relative rounded-card overflow-hidden ring-1 ring-inset ring-ink/[0.06] ${className}`}
      style={{ background: 'linear-gradient(120deg, rgb(var(--accent) / 0.14), transparent 60%), rgb(var(--bg-card))' }}
    >
      <div className="relative p-6 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8 h-full">
        <div className="flex-1 min-w-0">
          <h1 id="following-title" className="font-display italic font-extrabold text-5xl sm:text-[4rem] leading-[0.9] pr-2">{T.following.title}</h1>
          <p className="mt-2 text-[0.9375rem] text-text-secondary">{T.following.tagline}</p>
        </div>

        {users.length > 0 && (
          <div className="flex flex-col gap-2 sm:items-end shrink-0">
            <div aria-hidden="true" className="flex items-center pl-2">
              {stack.map((u) => (
                <span key={u.username} className="relative -ml-2">
                  {u.avatar ? (
                    <Image src={u.avatar} alt="" width={34} height={34} className="w-[2.125rem] h-[2.125rem] rounded-full object-cover ring-[3px] ring-bg-card" unoptimized />
                  ) : (
                    <span className="w-[2.125rem] h-[2.125rem] rounded-full bg-bg-main ring-[3px] ring-bg-card flex items-center justify-center">
                      <IconUser size={14} className="text-text-secondary" />
                    </span>
                  )}
                  <PresenceDot online={u.online} size="xs" />
                </span>
              ))}
              {more > 0 && (
                <span className="ml-1.5 h-[2.125rem] px-2 rounded-[0.375rem] bg-ink/[0.08] text-xs font-bold text-text-secondary flex items-center tabular-nums">
                  +{more.toLocaleString(lang)}
                </span>
              )}
            </div>
            <p className="text-sm">
              <strong className="text-[1.375rem] font-extrabold tabular-nums">{users.length.toLocaleString(lang)}</strong> {T.following.people.toLowerCase()}
              {online > 0 && (
                <>
                  {' · '}
                  <span className="text-success font-bold">{T.following.onlineNow.replace('{n}', online.toLocaleString(lang))}</span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
