'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconCrown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { rankBy, type LeaderRow, type StatKey } from '@/utils/friends'
import { pillClass } from '@/components/ui/Pill'
import Kicker from '@/components/ui/Kicker'
import Avatar from '@/components/ui/Avatar'

const KEYS: StatKey[] = ['week', 'activeDays', 'streak', 'completed']

const chipClass = (on: boolean) => pillClass(on)

/**
 * You and the people you follow, ranked on one measure at a time: unlocks this
 * week, active days, streak or games at 100%. Your own row is marked in words
 * as well as tint.
 */
export default function MainPageFriendsLeaderboard({ rows }: { rows: LeaderRow[] }) {
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
        <Kicker as="h3">{T.friends.leaderboard}</Kicker>
        <div role="group" aria-label={T.friends.rankBy} className="flex flex-wrap gap-1.5">
          {KEYS.map((k) => (
            <button key={k} type="button" aria-pressed={key === k} onClick={() => setKey(k)} className={chipClass(key === k)}>
              {labels[k]}
            </button>
          ))}
        </div>
      </div>

      <ol className="flex flex-col gap-1 enter-rows">
        {ranked.map((r, i) => {
          const inner = (
            <>
              <span className="w-6 text-center text-xs font-semibold tabular-nums text-text-secondary shrink-0">
                {i === 0 && r.stats[key] > 0 ? <IconCrown size={16} className="text-warning inline" aria-label={T.friends.leader} /> : i + 1}
              </span>
              <Avatar src={r.avatar} name={r.username} size={28} fallback="icon" online={r.online} announce />
              <span className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  {r.username}
                  {r.isMe && <Kicker as="span" tone="accent" className="ml-1.5">{T.userProfile.you}</Kicker>}
                </span>
                <span aria-hidden="true" className="h-1 rounded-full bg-ink/10 overflow-hidden">
                  <span className="block h-full rounded-full bg-progress" style={{ width: `${(r.stats[key] / max) * 100}%` }} />
                </span>
              </span>
              <span className="text-sm font-bold tabular-nums shrink-0 w-14 text-right">{show(r)}</span>
            </>
          )
          const cls = `flex items-center gap-3 px-2 py-1.5 rounded-box ${r.isMe ? 'bg-accent/10' : ''}`
          return (
            <li key={r.username}>
              {r.isMe ? (
                <div className={cls}>{inner}</div>
              ) : (
                <Link
                  href={`/user/${encodeURIComponent(r.username)}#compare`}
                  className={`${cls} hover:bg-ink/[0.06] transition-colors focus-ring`}
                >
                  {inner}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
