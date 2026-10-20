'use client'

import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import RankingsPageUser from '../rankings-page-user/RankingsPageUser'

/** Who stands just above and below you, and by how much: the race worth watching when the top is far away. */
export default function RankingsPageNear({ me, near }: { me: RankRow; near: RankRow[] }) {
  const { T, lang } = useLanguage()
  const n = (x: number) => x.toLocaleString(lang)
  const rows = [...near, me].sort((a, b) => a.rank - b.rank || (a.isMe ? 1 : -1))

  return (
    <section aria-labelledby="rankings-near-title" className="bg-bg-card rounded-3xl p-5 flex flex-col gap-3">
      <h2 id="rankings-near-title" className="text-xs uppercase tracking-wider font-bold text-text-secondary">
        {T.rankings.near}
      </h2>
      <ol className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <li
            key={r.username}
            className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2.5 py-2 text-sm ${r.isMe ? 'bg-accent/10 ring-1 ring-accent/40' : 'bg-bg-main'}`}
          >
            <span className="font-extrabold tabular-nums text-text-secondary">#{n(r.rank)}</span>
            <RankingsPageUser row={r} linked>
              {!r.isMe && (
                <span className="text-[11px] text-text-secondary">
                  {r.points >= me.points ? T.rankings.ahead.replace('{n}', n(r.points - me.points)) : T.rankings.behind.replace('{n}', n(me.points - r.points))}
                </span>
              )}
            </RankingsPageUser>
            <span className="font-bold tabular-nums">{n(r.points)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
