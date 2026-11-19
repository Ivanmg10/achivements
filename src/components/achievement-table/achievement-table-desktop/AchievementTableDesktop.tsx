import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { AchievementColumn, AchievementView } from '@/types/achievementTable'
import type { TableEntry, TableSort } from '@/utils/achievementTable'
import { TABLE, TH } from '@/components/ui/dataTable'
import { SortableHeader } from '../sortable-header/SortableHeader'
import { foldItem } from '@/components/ui/FoldList'
import AchievementTableRow from '../achievement-table-row/AchievementTableRow'

const ALIGN = { center: 'text-center', right: 'text-right' }

/** The table from `sm` up: icon, name, the columns (sortable through real buttons in their heads), and the pin. */
export default function AchievementTableDesktop<T>({
  id,
  views,
  columns,
  nameLabel,
  sort,
  onSort,
  pinColumn,
  tags,
  unoptimized,
  cap,
}: {
  /** The panel the PSN group tabs control. */
  id: string
  views: AchievementView<T>[]
  columns: AchievementColumn<T>[]
  nameLabel: string
  sort: TableSort
  onSort: (key: string) => void
  pinColumn: boolean
  tags?: (e: TableEntry<T>) => ReactNode
  unoptimized: boolean
  /** The rows shown folded: those after it come in when the table unfolds. */
  cap: number
}) {
  const { T } = useLanguage()
  return (
    <div id={id} className="hidden sm:block w-full">
      <table className={TABLE}>
        <thead>
          <tr>
            <th scope="col" className={`${TH} w-16`}>
              <span className="sr-only">{T.gameInfoTable.headerIcon}</span>
            </th>
            <SortableHeader sortKey="default" sortState={sort} onSort={onSort}>
              {nameLabel}
            </SortableHeader>
            {columns.map((c) =>
              c.sort ? (
                <SortableHeader key={c.key} sortKey={c.key} sortState={sort} onSort={onSort} align={c.align} className={c.width}>
                  {c.label}
                </SortableHeader>
              ) : (
                <th key={c.key} scope="col" className={`${TH} ${ALIGN[c.align]} ${c.width ?? ''}`}>
                  {c.label}
                </th>
              ),
            )}
            {pinColumn && (
              <th scope="col" className={`${TH} w-12`}>
                <span className="sr-only">{T.favorites.title}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="enter-rows">
          {views.map((v, i) => (
            <AchievementTableRow key={v.entry.row.id} view={v} columns={columns} tags={tags} unoptimized={unoptimized} fold={foldItem(i, cap)} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
