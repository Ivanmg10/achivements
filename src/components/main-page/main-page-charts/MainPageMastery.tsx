'use client'

import Image from 'next/image'
import Link from 'next/link'
import { RetroAchievementsGameCompleted, UserAwards } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import ClosestToComplete, { CLOSEST_SHOWN } from './closest-to-complete/ClosestToComplete'
import MasteryByConsole from './mastery-by-console/MasteryByConsole'
import MasteryMix from './mastery-mix/MasteryMix'

export default function MainPageMastery({
  awards,
  isLoading,
  unlockedHC,
  unlockedSC,
  inProgress = [],
}: {
  awards: UserAwards | null
  isLoading?: boolean
  unlockedHC: number
  unlockedSC: number
  /** Started games, for the ones nearest a mastery. */
  inProgress?: RetroAchievementsGameCompleted[]
}) {
  const { T } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.masteryAwards}</p>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-bg-main rounded-lg h-16 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded bg-ink/10 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!awards) return null

  // RA sends masteries as 'Mastery/Completion', hardcore marked by AwardDataExtra 1.
  // Filtering on 'Mastery' matched nothing, so this row never showed.
  const mastered = [...(awards.VisibleUserAwards ?? [])]
    .filter((a) => a.AwardType === 'Mastery/Completion' && a.AwardDataExtra === 1)
    .sort((a, b) => Date.parse(b.AwardedAt) - Date.parse(a.AwardedAt))
  const recentCovers = mastered.slice(0, 8)

  const masteries = awards.MasteryAwardsCount ?? 0

  // What the card is missing next to the rest of the page: masteries say what
  // is finished, this says what is nearly finished.
  const closest = [...inProgress]
    .sort((a, b) => parseFloat(b.PctWon) - parseFloat(a.PctWon))
    .slice(0, CLOSEST_SHOWN)
    .map((game) => ({
      key: String(game.GameID),
      href: `/gameInfo/${game.GameID}`,
      title: game.Title,
      imageUrl: game.ImageIcon ? `https://retroachievements.org${game.ImageIcon}` : undefined,
      done: game.NumAwarded,
      total: game.MaxPossible,
      percent: parseFloat(game.PctWon) * 100,
    }))

  const mixTotal =
    masteries +
    (awards.CompletionAwardsCount ?? 0) +
    (awards.BeatenHardcoreAwardsCount ?? 0) +
    (awards.BeatenSoftcoreAwardsCount ?? 0)

  // Supporting numbers: they explain the headline, they do not compete with it.
  const stats = [
    { value: unlockedHC.toLocaleString(), label: T.userStats.unlockedHC },
    { value: unlockedSC.toLocaleString(), label: T.userStats.unlockedSC },
    ...((awards.EventAwardsCount ?? 0) > 0
      ? [{ value: String(awards.EventAwardsCount), label: T.userStats.events }]
      : []),
  ]


  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.masteryAwards}</p>

      {/*
        Two columns from sm up: the totals beside where they come from (by
        console), then what was mastered lately beside what is nearly there.
        A column with nothing to show is simply not drawn.
      */}
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          {/* The headline: masteries, against every award earned. */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-warning tabular-nums leading-none">{masteries}</span>
            <span className="text-xs text-text-secondary">
              {T.cards.mastered} · {(awards.TotalAwardsCount ?? mixTotal).toLocaleString()} {T.userStats.awards.toLowerCase()}
            </span>
          </div>

          <MasteryMix awards={awards} />

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="text-sm font-semibold text-text-main tabular-nums">{value}</span>
                <span className="text-[10px] text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <MasteryByConsole awards={awards.VisibleUserAwards ?? []} />

      {recentCovers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] text-text-secondary uppercase tracking-widest">{T.cards.recentMasteries}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {recentCovers.map((a, i) => (
              <Link
                key={i}
                href={`/gameInfo/${a.AwardData}`}
                title={`${a.Title} — ${a.ConsoleName}`}
                className="relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
              >
                {a.ImageIcon ? (
                  <Image
                    src={`https://retroachievements.org${a.ImageIcon}`}
                    alt={a.Title}
                    width={56}
                    height={56}
                    className="w-full aspect-square object-cover rounded hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full aspect-square rounded bg-ink/10" />
                )}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border border-bg-card" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <ClosestToComplete games={closest} statClassName="text-accent" />
      </div>
    </div>
  )
}
