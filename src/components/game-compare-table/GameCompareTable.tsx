'use client'

import { useMemo, useState } from 'react'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { compareSummary, filterCompare, mergeCompare, type CompareAchievement, type CompareFilter } from '@/utils/gameCompare'
import EmptyState from '@/components/empty-state/EmptyState'
import GameCompareTableSummary from './game-compare-table-summary/GameCompareTableSummary'
import GameCompareTableRow from './game-compare-table-row/GameCompareTableRow'
import { pillClass } from '@/components/ui/Pill'

const COMPARE_FILTERS: CompareFilter[] = ['all', 'both', 'onlyThem', 'onlyMe', 'neither']
const SOLO_FILTERS = ['all', 'earned', 'locked'] as const
type SoloFilter = (typeof SOLO_FILTERS)[number]

const chipClass = (on: boolean) => pillClass(on)

/**
 * A game's achievements as one user has them, and — comparing — as you do,
 * side by side the way PlayStation compares trophies: who has each and
 * when, who got it first, and filters for what you share and what only one
 * of you has. The same for RA, Steam and PSN.
 */
export default function GameCompareTable({
  theirs,
  mine,
  username,
  comparing,
  mineLoading = false,
  notice,
}: {
  theirs: CompareAchievement[]
  /** Your own list; null while comparing means there is none to set beside (shown as nothing earned). */
  mine: CompareAchievement[] | null
  username: string
  comparing: boolean
  mineLoading?: boolean
  /** Why your side is empty, when it is (not linked, not played…). */
  notice?: React.ReactNode
}) {
  const { T } = useLanguage()
  const [filter, setFilter] = useState<CompareFilter | SoloFilter>('all')

  // The filters differ between the two views: switching starts from all.
  useWhenChanged([comparing], () => setFilter('all'))

  const rows = useMemo(() => mergeCompare(theirs, comparing ? mine ?? [] : null), [theirs, mine, comparing])
  const summary = useMemo(() => compareSummary(rows), [rows])
  const shown = useMemo(() => {
    if (filter === 'earned') return rows.filter((r) => r.earned)
    if (filter === 'locked') return rows.filter((r) => !r.earned)
    return filterCompare(rows, filter)
  }, [rows, filter])

  const labels: Record<CompareFilter | SoloFilter, string> = {
    all: T.userGame.filterAll,
    both: T.userGame.filterBoth,
    onlyThem: T.userGame.filterOnly.replace('{who}', username),
    onlyMe: T.userGame.filterOnly.replace('{who}', T.userProfile.you),
    neither: T.userGame.filterNeither,
    earned: T.userGame.filterEarned,
    locked: T.userGame.filterLocked,
  }
  const counts: Record<CompareFilter | SoloFilter, number> = {
    ...summary,
    earned: summary.theirs,
    locked: summary.all - summary.theirs,
  }

  if (theirs.length === 0) {
    return (
      <section className="bg-bg-card rounded-xl p-6 w-full">
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.userGame.noAchievements} size="compact" />
      </section>
    )
  }

  return (
    <section aria-label={T.gameInfoPage.achievements} className="bg-bg-card rounded-xl p-4 sm:p-5 flex flex-col gap-4 w-full">
      <GameCompareTableSummary summary={summary} username={username} comparing={comparing && !mineLoading} />
      {comparing && notice}

      <div role="group" aria-label={T.userGame.filtersLabel} className="flex flex-wrap gap-1.5">
        {(comparing ? COMPARE_FILTERS : SOLO_FILTERS).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={chipClass(filter === f)}>
            {labels[f]} <span className="tabular-nums opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-6">{T.userGame.noneMatch}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((row) => (
            <GameCompareTableRow key={row.id} row={row} username={username} comparing={comparing} mineLoading={mineLoading} />
          ))}
        </ul>
      )}
    </section>
  )
}
