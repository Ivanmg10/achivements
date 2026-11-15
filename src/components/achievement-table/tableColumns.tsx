import { IconCheck } from '@tabler/icons-react'
import type { Translations } from '@/translations/en'
import type { AchievementColumn, TableTexts } from '@/types/achievementTable'
import RarityBadge from '@/components/ui/RarityBadge'
import DateText from '@/components/ui/DateText'

/** Every platform's columns: its own, then rarity and earned, then its own `end` ones. */
export function tableColumns<T>(own: AchievementColumn<T>[], texts: Pick<TableTexts, 'earned' | 'locked'>, T: Translations): AchievementColumn<T>[] {
  const rarity: AchievementColumn<T> = {
    key: 'rarity',
    label: T.gameInfoTable.headerRarity,
    align: 'center',
    width: 'w-28',
    sort: { first: 'asc' },
    cell: ({ row }) => <RarityBadge pct={row.rarity} />,
  }
  const earned: AchievementColumn<T> = {
    key: 'earned',
    label: T.gameInfoTable.headerEarned,
    align: 'right',
    width: 'w-32',
    sort: { first: 'desc' },
    // When, not a tick: the date says it was earned. RA says in which mode under it, in its colour.
    cell: ({ row }) =>
      row.earned && row.earnedAt ? (
        <span className="inline-flex flex-col items-end leading-tight">
          <span className="sr-only">{texts.earned}</span>
          <DateText value={row.earnedAt} className="whitespace-nowrap text-text-main" />
          {row.hardcore !== undefined && (
            <span className={`text-xs ${row.hardcore ? 'text-hardcore' : 'text-text-secondary'}`}>
              {row.hardcore ? T.categoryPage.hardcore : T.categoryPage.softcore}
            </span>
          )}
        </span>
      ) : row.earned ? (
        <span className="text-success">
          <span className="sr-only">{texts.earned}</span>
          <IconCheck className="w-[1.125rem] h-[1.125rem] inline-block" aria-hidden="true" />
        </span>
      ) : (
        <span className="text-text-secondary">
          <span className="sr-only">{texts.locked}</span>—
        </span>
      ),
  }
  return [...own.filter((c) => !c.end), rarity, earned, ...own.filter((c) => c.end)]
}
