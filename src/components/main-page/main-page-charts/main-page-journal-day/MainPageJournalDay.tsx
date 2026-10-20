'use client'

import { useState } from 'react'
import type { JournalDay } from '@/utils/activityInsights'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { achievementGameIconUrl, plural } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import { GameListRow } from '@/components/ui/GameListRow'

const GAMES_SHOWN = 2
const DAY_MS = 86_400_000

/**
 * One day of the activity diary: "Today", "Yesterday" or its date, how many
 * unlocks, and the games behind them, busiest first (the rest counted).
 */
export default function MainPageJournalDay({ day }: { day: JournalDay }) {
  const { T, lang } = useLanguage()
  const subject = useSubject()
  // Read once: render has to give the same answer every time.
  const [today] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  })
  const [y, m, dd] = day.day.split('-').map(Number)
  const date = new Date(y, m - 1, dd)
  const ago = Math.round((today.getTime() - date.getTime()) / DAY_MS)
  const label =
    ago <= 1
      ? new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-ago, 'day')
      : new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
  const hidden = day.games.length - GAMES_SHOWN

  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold capitalize">{label}</span>
        <span className="text-text-secondary">{plural(day.total, T.plurals.achievements, lang)}</span>
      </p>
      {day.games.slice(0, GAMES_SHOWN).map((g) => (
        <GameListRow
          key={`${g.source}:${g.gameId}`}
          href={gameHref(g.source, g.gameId, subject)}
          imageUrl={achievementGameIconUrl(g.sample)}
          title={g.title}
          subtitle={g.console}
          stat={String(g.count)}
          statClassName="text-accent"
        />
      ))}
      {hidden > 0 && <p className="text-[10px] text-text-secondary pl-1">+{plural(hidden, T.plurals.games, lang)}</p>}
    </div>
  )
}
