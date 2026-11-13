'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useLandingSample } from '@/hooks/useLandingSample'
import { loadSampleTrophies } from '@/components/landing-page/sample-library/landingLibrary'
import { fromPsn } from '@/utils/gameInsights'
import { formatDate } from '@/utils/dates'
import { decimal } from '@/utils/utils'
import { TROPHY_GRADE_COLOR, TROPHY_GRADE_RING, TROPHY_GRADES } from '@/utils/psnTitles'
import GameExpandedLayout from '@/components/game-expanded-layout/GameExpandedLayout'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import RarestEarned from '@/components/rarest-earned/RarestEarned'
import LazyBadgeGrid from '@/components/badge-grid/lazy-badge-grid/LazyBadgeGrid'
import BadgeGrid from '@/components/badge-grid/BadgeGrid'
import BadgeRarity from '@/components/badge-grid/badge-tip-parts/BadgeRarity'
import BadgeEarnedChip from '@/components/badge-grid/badge-tip-parts/BadgeEarnedChip'
import type { PsnTrophy, TrophyCounts } from '@/types/psn'

/** Trophies by grade, of those that pass `keep`. */
const countByGrade = (list: PsnTrophy[], keep: (t: PsnTrophy) => boolean) =>
  Object.fromEntries(TROPHY_GRADES.map((g) => [g, list.filter((t) => t.type === g && keep(t)).length])) as TrophyCounts

/**
 * The PSN example opened in the landing's library (`set`, its trophy set), drawn as the home feed draws one
 * (`PsnRecentlyPlayedExpanded`): the ring with the trophies by grade, the unlocks over time, the rarest earned and every
 * trophy in the badge grid, from the sample's data. Nothing in it links: it is an example.
 */
export default function LandingSamplePsnExpanded({ set, total }: { set: string; total: number }) {
  const { T, lang } = useLanguage()
  const { list: trophies, isLoading, error, retry } = useLandingSample(set, loadSampleTrophies)
  const earned = trophies.filter((t) => t.earned).length

  return (
    <GameExpandedLayout
      earned={earned}
      total={trophies.length || total}
      ringLabel={T.psn.trophies}
      ringExtra={<PsnTrophyCounts earned={countByGrade(trophies, (t) => t.earned)} of={countByGrade(trophies, () => true)} className="flex-col items-start! @3xl:items-center!" />}
      gridTitle={T.psn.trophies}
      unlocks={fromPsn(trophies, 0)}
      isLoading={isLoading}
      side={
        <RarestEarned
          title={T.psn.rarestEarned}
          empty={T.psn.noneEarned}
          isLoading={isLoading}
          ring="ring-psn"
          rows={trophies
            .filter((t): t is PsnTrophy & { rarity: number } => t.earned && t.rarity !== null)
            .map((t) => ({
              key: String(t.id),
              name: t.name,
              icon: t.iconUrl,
              rarity: t.rarity,
              subline: (
                <>
                  <span className={TROPHY_GRADE_COLOR[t.type]}>{T.psn[t.type]}</span>
                  <span className="text-text-secondary"> · {T.psn.rarity.replace('{n}', decimal(t.rarity, lang))}</span>
                </>
              ),
            }))}
        />
      }
    >
      <LazyBadgeGrid
        loading={isLoading}
        count={trophies.length || total}
        size={40}
        error={error ? { message: T.psn.trophiesError, retryLabel: T.psn.retry, onRetry: retry } : null}
        empty={null}
      >
        <BadgeGrid<PsnTrophy>
          items={trophies}
          keyOf={(t) => t.id}
          badgeSize={40}
          name={(t, concealed) => (concealed ? T.psn.hiddenTrophy : t.name)}
          label={(t, name) => `${name}, ${T.psn[t.type]}, ${t.earned ? T.psn.earned : T.psn.locked}`}
          earned={(t) => t.earned}
          ring={(t) => (t.earned ? TROPHY_GRADE_RING[t.type] : undefined)}
          icon={(t) => t.iconUrl}
          secret={(t) => t.hidden && !t.earned}
          tip={(t, concealed) => ({
            description: concealed ? T.psn.hiddenTrophyDesc : t.detail,
            chips: (
              <>
                <span className={`text-xs font-semibold ${TROPHY_GRADE_COLOR[t.type]}`}>{T.psn[t.type]}</span>
                <BadgeRarity pct={t.rarity} />
                <BadgeEarnedChip earned={t.earned} label={T.psn.earned} className="bg-psn/20 text-psn-light" />
              </>
            ),
            date: t.earnedAt ? formatDate(t.earnedAt, lang) : null,
          })}
        />
      </LazyBadgeGrid>
    </GameExpandedLayout>
  )
}
