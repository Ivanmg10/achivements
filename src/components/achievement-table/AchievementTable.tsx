'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconTrophyOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameSource } from '@/types/game'
import type { AchievementColumn, AchievementView, DetailBase, PinControl, RevealControl, TableTexts } from '@/types/achievementTable'
import { useAchievementTable } from '@/hooks/useAchievementTable'
import type { CompareAchievement } from '@/utils/gameCompare'
import type { TableEntry } from '@/utils/achievementTable'
import { tableColumns } from './tableColumns'
import AchievementTableToolbar from '@/components/achievement-table-toolbar/AchievementTableToolbar'
import ShowRestButton from '@/components/show-rest-button/ShowRestButton'
import MissableNotice from '@/components/missable-notice/MissableNotice'
import EmptyState from '@/components/empty-state/EmptyState'
import { SURFACE } from '@/components/ui/surface'
import { buttonClass } from '@/components/ui/Button'
import AchievementTableDesktop from './achievement-table-desktop/AchievementTableDesktop'
import AchievementTableCard from './achievement-table-card/AchievementTableCard'
import AchievementTableDetail from './achievement-table-detail/AchievementTableDetail'

const WRAP = 'w-full px-4 sm:px-8 lg:px-14 mt-7 mb-7'

export type AchievementTableProps<T> = {
  source: GameSource
  gameId: number
  gameTitle: string
  /** The platform's list, in the game's order. */
  items: T[]
  /** Its row: a stable function (module level, or memoized), as it is read once per list. */
  toRow: (t: T) => CompareAchievement
  texts: TableTexts
  pins: PinControl<T>
  /** Where secret ones can be shown before they are earned (PSN, Xbox). */
  reveal?: RevealControl<T>
  /** The platform's own columns (grade, gamerscore, players, points); rarity and earned are always there. */
  columns?: AchievementColumn<T>[]
  /** The order menu's keys after the game order; the sortable columns' by default. */
  sortMenu?: string[]
  /** Beside the name in a row, at the end of a card's facts (RA's type, Steam's "online?"). */
  tags?: (e: TableEntry<T>) => ReactNode
  /** The line above the table that names some of them and can keep only those (RA's missables, Steam's online ones). */
  notice?: { match: (e: TableEntry<T>) => boolean; tone?: 'danger' | 'warning'; lead?: (n: number) => string; text?: string }
  /** Tabs over the table that show one part of the game (PSN's DLC). */
  scopes?: { of: (t: T) => string; tabs: (scope: string, onSelect: (scope: string) => void, panelId: string) => ReactNode }
  /** The detail window: its tags and the name guides search by, or a window of the platform's own (RA). */
  detail?: { tags?: (t: T) => ReactNode; guideTitle?: (t: T) => string; render?: (t: T, base: DetailBase) => ReactNode }
  /** Steam shows a secret one's picture; PSN and Xbox hide it with its name. */
  keepSecretIcon?: boolean
  pinInTitle?: boolean
}

/**
 * A game page's achievements on any platform, as agreed on the canvas: an
 * optional line or tabs on top, the filters with their counts beside a search
 * and the order, then the table (cards on a phone), its first rows and a button
 * for the rest, and a detail window. Pinned ones lead; a link to one lands on it.
 * Each platform is a small adapter around it: `docs/platform-shells.md`.
 */
export default function AchievementTable<T>(props: AchievementTableProps<T>) {
  const { source, gameId, gameTitle, items, toRow, texts, pins, reveal, sortMenu, tags, notice, scopes, detail, keepSecretIcon, pinInTitle } = props
  const { T } = useLanguage()
  const panelId = useId()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const entries = useMemo(() => items.map((item, order) => ({ item, row: toRow(item), order })), [items, toRow])
  const columns = tableColumns(props.columns ?? [], texts, T)
  const concealed = (e: TableEntry<T>) => !!e.row.secret && !e.row.earned && !reveal?.isRevealed(e.item)
  const titleOf = (e: TableEntry<T>) => (concealed(e) ? texts.secret ?? e.row.title : e.row.title)
  const textOf = (e: TableEntry<T>) => (concealed(e) ? texts.secretText ?? e.row.description : e.row.description)
  const iconOf = (e: TableEntry<T>) => (concealed(e) && !keepSecretIcon ? null : e.row.iconUrl)

  const table = useAchievementTable({
    items,
    entries,
    searchText: (e) => (concealed(e) ? titleOf(e) : `${e.row.title} ${e.row.description}`),
    leads: (e) => pins.canPin && pins.leads(e.item),
    inNotice: notice?.match,
    scopeOf: scopes && ((e) => scopes.of(e.item)),
    sortValue: (key) => columns.find((c) => c.key === key)?.sort?.value,
    firstDir: (key) => columns.find((c) => c.key === key)?.sort?.first ?? 'asc',
  })

  const view = (e: TableEntry<T>): AchievementView<T> => ({
    entry: e,
    title: titleOf(e),
    text: textOf(e),
    iconUrl: iconOf(e),
    highlighted: table.highlighted === e.row.id,
    pinned: pins.canPin ? pins.isPinned(e.item) : undefined,
    onTogglePin: () => pins.toggle(e.item),
    onOpen: () => setSelectedId(e.row.id),
    eye:
      reveal && e.row.secret && !e.row.earned
        ? { revealed: reveal.isRevealed(e.item), onToggle: () => reveal.toggle(e.item), labels: { reveal: texts.reveal ?? '', conceal: texts.conceal ?? '' } }
        : undefined,
  })

  const detailBase = (e: TableEntry<T>): DetailBase => ({
    title: titleOf(e),
    description: textOf(e),
    iconUrl: iconOf(e),
    earned: e.row.earned,
    earnedAt: e.row.earnedAt,
    rarity: e.row.rarity,
    concealed: concealed(e),
    pinned: pins.canPin ? pins.isPinned(e.item) : undefined,
    onTogglePin: () => pins.toggle(e.item),
    onClose: () => setSelectedId(null),
  })

  if (items.length === 0) {
    return (
      <div className={WRAP}>
        <section aria-label={texts.label} className={SURFACE}>
          <EmptyState icon={<IconTrophyOff className="w-6 h-6" />} title={T.statusGameItem.noPublishedAchievements} className="py-12" />
        </section>
      </div>
    )
  }

  const secrets = reveal ? entries.filter((e) => e.row.secret && !e.row.earned) : []
  const allRevealed = secrets.length > 0 && secrets.every((e) => reveal?.isRevealed(e.item))
  const views = table.shown.map(view)
  const selected = entries.find((e) => e.row.id === selectedId)

  return (
    <div className={WRAP}>
      <section aria-label={texts.label} className={`${SURFACE} p-4 sm:p-6 flex flex-col gap-4`}>
        {scopes?.tabs(table.scope, table.setScope, panelId)}
        {notice && (
          <MissableNotice
            tone={notice.tone}
            lead={notice.lead?.(table.noticed.length)}
            text={notice.text}
            names={table.noticed.map(titleOf)}
            only={table.filter === 'notice'}
            onToggleOnly={table.toggleNotice}
          />
        )}
        <AchievementTableToolbar
          label={texts.label}
          tabs={[
            { value: 'all', label: T.gameInfoTable.filterAll, count: table.counts.all },
            { value: 'earned', label: T.gameInfoTable.filterEarned, count: table.counts.earned },
            { value: 'unearned', label: T.gameInfoTable.filterUnearned, count: table.counts.unearned },
          ]}
          filter={table.filter}
          onFilter={table.setFilter}
          query={table.query}
          onQuery={table.setQuery}
          sortOptions={[
            { value: 'default', label: T.gameInfoTable.sortGameOrder },
            ...(sortMenu ?? columns.filter((c) => c.sort).map((c) => c.key)).map((key) => ({ value: key, label: columns.find((c) => c.key === key)?.label ?? key })),
          ]}
          sort={table.sort.key}
          onSort={table.sortBy}
          extra={
            secrets.length > 0 && (
              <button type="button" onClick={() => reveal?.setAll(secrets.map((e) => e.item), !allRevealed)} aria-pressed={allRevealed} className={buttonClass('quiet', 'sm')}>
                {allRevealed ? texts.concealAll : texts.revealAll}
              </button>
            )
          }
        />

        {table.filtered.length === 0 ? (
          <p className="text-sm text-text-secondary self-center py-6">{table.searching ? T.gameInfoTable.noMatches : texts.none}</p>
        ) : (
          <>
            <AchievementTableDesktop
              id={panelId}
              views={views}
              columns={columns}
              nameLabel={texts.name}
              sort={table.sort}
              onSort={table.sortColumn}
              pinColumn={pins.canPin && !pinInTitle}
              tags={tags}
              pinInTitle={pinInTitle}
              unoptimized={source !== 'ra'}
            />
            <ul className="sm:hidden w-full flex flex-col gap-2 enter-rows">
              {views.map((v) => (
                <AchievementTableCard key={v.entry.row.id} view={v} columns={columns} tags={tags} texts={texts} unoptimized={source !== 'ra'} />
              ))}
            </ul>
            {table.rest > 0 && <ShowRestButton folded={table.folded} rest={table.rest} onToggle={table.toggleFold} />}
          </>
        )}

        <AnimatePresence>
          {selected && detail?.render?.(selected.item, detailBase(selected))}
          {selected && source !== 'ra' && !detail?.render && (
            <AchievementTableDetail
              key={selected.row.id}
              base={detailBase(selected)}
              row={selected.row}
              source={source}
              gameId={gameId}
              gameTitle={gameTitle}
              tags={detail?.tags?.(selected.item)}
              guideTitle={detail?.guideTitle?.(selected.item) ?? selected.row.title}
            />
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
