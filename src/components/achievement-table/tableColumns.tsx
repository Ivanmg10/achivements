import { IconCheck } from '@tabler/icons-react'
import type { Translations } from '@/translations/en'
import type { AchievementColumn, TableTexts } from '@/types/achievementTable'
import RarityBadge from '@/components/ui/RarityBadge'

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
    width: 'w-28',
    sort: { first: 'desc' },
    cell: ({ row }) =>
      row.earned ? (
        <IconCheck className="w-[1.125rem] h-[1.125rem] text-success inline-block" aria-label={texts.earned} />
      ) : (
        <span className="text-text-secondary">
          <span className="sr-only">{texts.locked}</span>—
        </span>
      ),
  }
  return [...own.filter((c) => !c.end), rarity, earned, ...own.filter((c) => c.end)]
}
