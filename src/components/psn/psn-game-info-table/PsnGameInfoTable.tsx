'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { PsnTrophy, PsnTrophyGroup } from '@/types/psn'
import type { AchievementColumn } from '@/types/achievementTable'
import { usePsnFavoriteTrophies } from '@/hooks/usePsnFavoriteTrophies'
import { useRevealedTrophies } from '@/hooks/useRevealedTrophies'
import { psnCompareItem } from '@/utils/gameCompare'
import { BASE_GROUP, dlcShortName, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import AchievementTable from '@/components/achievement-table/AchievementTable'
import PsnTrophyGroupTabs from './psn-trophy-group-tabs/PsnTrophyGroupTabs'

/** A PSN game's trophies on the shared table: a grade column (a trophy's grade is what PSN is about), DLC tabs, and hidden trophies that can be revealed. */
export default function PsnGameInfoTable({
  trophies,
  groups = [],
  gameId,
  gameTitle,
}: {
  trophies: PsnTrophy[]
  groups?: PsnTrophyGroup[]
  gameId: number
  gameTitle: string
}) {
  const { T } = useLanguage()
  const { pinned, leading, toggle, canPin } = usePsnFavoriteTrophies(gameId, gameTitle)
  const { isRevealed, toggle: toggleOne, setAll } = useRevealedTrophies()
  const inOrder = useMemo(() => [...trophies].sort((a, b) => a.id - b.id), [trophies])
  const gradeChip = (t: PsnTrophy) => <span className={`font-semibold ${TROPHY_GRADE_COLOR[t.type]}`}>{T.psn[t.type]}</span>
  const grade: AchievementColumn<PsnTrophy> = {
    key: 'grade',
    label: T.psn.grade,
    align: 'center',
    width: 'w-24',
    cell: ({ item }) => <span className={`font-bold ${TROPHY_GRADE_COLOR[item.type]}`}>{T.psn[item.type]}</span>,
    card: ({ item }) => gradeChip(item),
  }
  const dlcOf = (t: PsnTrophy) => (groups.length > 1 ? groups.find((g) => g.id === t.groupId && g.id !== BASE_GROUP) : undefined)

  return (
    <AchievementTable
      source="psn"
      gameId={gameId}
      gameTitle={gameTitle}
      items={inOrder}
      toRow={psnCompareItem}
      texts={{
        label: T.psn.trophies,
        name: T.psn.trophy,
        none: T.psn.noTrophies,
        earned: T.psn.earned,
        locked: T.psn.locked,
        secret: T.psn.hiddenTrophy,
        secretText: T.psn.hiddenTrophyDesc,
        reveal: T.psn.revealTrophy,
        conceal: T.psn.concealTrophy,
        revealAll: T.psn.showHiddenTrophies,
        concealAll: T.psn.hideHiddenTrophies,
      }}
      pins={{ canPin, isPinned: (t) => pinned.has(t.id), leads: (t) => leading.has(t.id), toggle }}
      reveal={{ isRevealed: (t) => isRevealed(t.id), toggle: (t) => toggleOne(t.id), setAll: (ts, on) => setAll(ts.map((t) => t.id), on) }}
      columns={[grade]}
      scopes={
        groups.length > 1
          ? {
              of: (t) => t.groupId,
              tabs: (scope, onSelect, panelId) => <PsnTrophyGroupTabs groups={groups} selected={scope} onSelect={onSelect} panelId={panelId} gameTitle={gameTitle} />,
            }
          : undefined
      }
      detail={{
        tags: (t) => {
          const dlc = dlcOf(t)
          return (
            <>
              {gradeChip(t)}
              {dlc && <span className="px-2 py-0.5 rounded-full bg-ink/10 text-text-secondary">DLC · {dlcShortName(dlc.name, gameTitle)}</span>}
            </>
          )
        },
      }}
    />
  )
}
