'use client'

import Image from 'next/image'
import { IconUser, IconUsers } from '@tabler/icons-react'
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
    <section aria-labelledby="following-title" className={`relative bg-bg-card rounded-card overflow-hidden ${className}`}>
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgb(var(--accent)/0.25),transparent_60%)]" />
      <IconUsers aria-hidden="true" size={220} stroke={1} className="hidden sm:block absolute -right-10 -bottom-16 text-accent/10 pointer-events-none" />

      <div className="relative px-4 sm:px-6 py-6 flex flex-col gap-5 h-full justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <span aria-hidden="true" className="w-12 h-12 rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/20 flex items-center justify-center shrink-0">
            <IconUsers size={24} />
          </span>
          <div className="min-w-0">
            <h1 id="following-title" className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[1.1] pr-1">{T.following.title}</h1>
            <p className="text-sm text-text-secondary">{T.following.tagline}</p>
          </div>
        </div>

        {users.length > 0 && (
          <div className="flex items-end gap-4 flex-wrap">
            <p className="flex flex-col">
              <span className="text-4xl font-bold tabular-nums leading-none">{users.length.toLocaleString(lang)}</span>
              <span className="text-[10px] uppercase tracking-widest text-text-secondary mt-1">{T.following.people}</span>
            </p>
            <div aria-hidden="true" className="flex items-center -space-x-2 pb-0.5">
              {stack.map((u) => (
                <span key={u.username} className="relative">
                  {u.avatar ? (
                    <Image src={u.avatar} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover ring-2 ring-bg-card" unoptimized />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-bg-main ring-2 ring-bg-card flex items-center justify-center">
                      <IconUser size={14} className="text-text-secondary" />
                    </span>
                  )}
                  <PresenceDot online={u.online} size="xs" />
                </span>
              ))}
              {more > 0 && (
                <span className="h-8 min-w-8 px-1.5 rounded-full bg-bg-main ring-2 ring-bg-card text-[11px] font-semibold text-text-secondary flex items-center justify-center tabular-nums">
                  +{more.toLocaleString(lang)}
                </span>
              )}
            </div>
            {online > 0 && (
              <p className="flex items-center gap-1.5 pb-1.5 text-xs font-medium text-success">
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
