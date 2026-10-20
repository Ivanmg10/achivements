'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconCrown, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { rankBy, type LeaderRow, type StatKey } from '@/utils/friends'
import PresenceDot from '@/components/presence-dot/PresenceDot'

const KEYS: StatKey[] = ['week', 'activeDays', 'streak', 'completed']

const chipClass = (on: boolean) =>
  `px-2.5 py-1 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
    on ? 'bg-bg-header text-text-main ring-1 ring-text-secondary/30' : 'bg-bg-main text-text-secondary hover:text-text-main'
  }`

/**
 * You and the people you follow, ranked on one measure at a time: unlocks this
 * week, active days, streak or games at 100%. Your own row is marked in words
 * as well as tint; a friend still loading holds their place with a dash.
 */
export default function MainPageFriendsLeaderboard({ rows, pending }: { rows: LeaderRow[]; pending: { username: string; avatar: string | null }[] }) {
  const { T, lang } = useLanguage()
  const [key, setKey] = useState<StatKey>('week')
  const ranked = rankBy(rows, key)
  const max = Math.max(1, ...ranked.map((r) => r.stats[key]))
  const labels: Record<StatKey, string> = {
    week: T.friends.metricWeek,
    activeDays: T.friends.metricActiveDays,
    streak: T.friends.metricStreak,
    completed: T.friends.metricCompleted,
  }
  const show = (r: LeaderRow) =>
    key === 'streak'
      ? (r.stats.streakCapped ? T.friends.daysCapped : T.userProfile.days).replace('{n}', String(r.stats.streak))
      : r.stats[key].toLocaleString(lang)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-text-secondary">{T.friends.leaderboard}</h3>
        <div role="group" aria-label={T.friends.rankBy} className="flex flex-wrap gap-1.5">
          {KEYS.map((k) => (
            <button key={k} type="button" aria-pressed={key === k} onClick={() => setKey(k)} className={chipClass(key === k)}>
              {labels[k]}
            </button>
          ))}
        </div>
      </div>

      <ol className="flex flex-col gap-1">
        {ranked.map((r, i) => {
          const inner = (
            <>
              <span className="w-6 text-center text-xs font-semibold tabular-nums text-text-secondary shrink-0">
                {i === 0 && r.stats[key] > 0 ? <IconCrown size={16} className="text-warning inline" aria-label={T.friends.leader} /> : i + 1}
              </span>
              <span className="relative shrink-0">
                {r.avatar ? (
                  <Image src={r.avatar} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover" unoptimized />
                ) : (
                  <span aria-hidden="true" className="w-7 h-7 rounded-full bg-bg-main flex items-center justify-center">
                    <IconUser size={14} className="text-text-secondary" />
                  </span>
                )}
                <PresenceDot online={r.online} size="sm" announce />
              </span>
              <span className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  {r.username}
                  {r.isMe && <span className="ml-1.5 text-[10px] uppercase tracking-wider text-accent">{T.userProfile.you}</span>}
                </span>
                <span aria-hidden="true" className="h-1 rounded-full bg-ink/10 overflow-hidden">
                  <span className="block h-full rounded-full bg-progress" style={{ width: `${(r.stats[key] / max) * 100}%` }} />
                </span>
              </span>
              <span className="text-sm font-bold tabular-nums shrink-0 w-14 text-right">{show(r)}</span>
            </>
          )
          const cls = `flex items-center gap-3 px-2 py-1.5 rounded-lg ${r.isMe ? 'bg-accent/10' : ''}`
          return (
            <li key={r.username}>
              {r.isMe ? (
                <div className={cls}>{inner}</div>
              ) : (
                <Link
                  href={`/user/${encodeURIComponent(r.username)}#compare`}
                  className={`${cls} hover:bg-ink/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
                >
                  {inner}
                </Link>
              )}
            </li>
          )
        })}
        {pending.map((p) => (
          <li key={p.username} aria-busy="true" className="flex items-center gap-3 px-2 py-1.5 text-text-secondary">
            <span className="w-6 text-center text-xs">·</span>
            <span className="w-7 h-7 rounded-full bg-ink/10 animate-pulse motion-reduce:animate-none shrink-0" />
            <span className="text-sm truncate flex-1">{p.username}</span>
            <span className="text-sm w-14 text-right">—</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
