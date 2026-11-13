'use client'

import { useLanguage } from '@/context/LanguageContext'
import { SAMPLE_RANKS, type RankPeriod } from '@/components/landing-page/landingSamples'
import RankingsPageRank from '@/components/rankings-page/rankings-page-rank/RankingsPageRank'
import Avatar from '@/components/ui/Avatar'

// The bars that stand for the others' names: a length each, so the rows do not look stamped.
const GHOSTS = ['w-28', '', 'w-32', 'w-24']

/**
 * The slice of the rankings around the example player (round five, "B", 2026-11-13): the place, a picture and
 * the points, the player's row tinted and named "You"; the people around them have no name, a grey bar in its
 * place (and "another person" to a screen reader), so the landing shows nobody, real or made up.
 */
export default function LandingRankSlice({ period }: { period: RankPeriod }) {
  const { T, lang } = useLanguage()
  const { first, points } = SAMPLE_RANKS[period]

  return (
    <ol className="flex flex-col gap-1">
      {points.map((p, i) => {
        const you = i === 1
        return (
          <li key={first + i} className={`flex items-center gap-3 sm:gap-4 px-3 py-2.5 rounded-tile ${you ? 'bg-accent/10 ring-1 ring-inset ring-accent/40' : ''}`}>
            <span className={`w-11 font-display italic font-extrabold text-[1.625rem] leading-none tabular-nums ${you ? 'text-accent' : 'text-text-secondary'}`}>
              <RankingsPageRank rank={first + i} />
            </span>
            <Avatar name={you ? T.rankings.you : T.landing.otherPlayer} fallback={you ? 'initial' : 'icon'} size={36} />
            {you ? (
              <span className="flex-1 min-w-0 font-extrabold">{T.rankings.you}</span>
            ) : (
              <span className="flex-1 min-w-0">
                <span className="sr-only">{T.landing.otherPlayer}</span>
                <span aria-hidden="true" className={`block h-3 max-w-full rounded-full bg-ink/10 ${GHOSTS[i]}`} />
              </span>
            )}
            <span className="tabular-nums whitespace-nowrap">
              <strong className="font-extrabold">{p.toLocaleString(lang)}</strong> <span className="text-[0.6875rem] text-text-secondary">{T.rankings.vp}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
