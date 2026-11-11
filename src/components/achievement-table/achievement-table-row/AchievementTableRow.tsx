import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { AchievementColumn, AchievementView } from '@/types/achievementTable'
import type { CompareAchievement } from '@/utils/gameCompare'
import { earnedRing, type TableEntry } from '@/utils/achievementTable'
import { formatUnlock } from '@/utils/steamFeed'
import { FadeImage } from '@/components/ui/FadeImage'
import { badgeClass, badgeImgClass, MID, NUM, ROW, TD, TD_FIRST } from '@/components/ui/dataTable'
import PinAchievementButton from '@/components/pin-achievement-button/PinAchievementButton'
import RevealSecretButton from '@/components/reveal-secret-button/RevealSecretButton'

/** When it was earned: RA says in which mode, in its colour. */
function UnlockLine({ row }: { row: CompareAchievement }) {
  const { T, lang } = useLanguage()
  if (!row.earned || !row.earnedAt) return null
  const when = formatUnlock(row.earnedAt, lang)
  if (row.hardcore === undefined) return <p className="mt-0.5 text-xs text-accent">{when}</p>
  return (
    <p className={`mt-0.5 text-xs ${row.hardcore ? 'text-hardcore' : 'text-text-secondary'}`}>
      {row.hardcore ? T.categoryPage.hardcore : T.categoryPage.softcore} · {when}
    </p>
  )
}

/**
 * One achievement as a row of the game page table: the badge (ringed once
 * earned, grey while locked, with the eye over a secret one), the name, which
 * is the button that opens it, stretched over the row, its text and unlock,
 * then the columns and the pin. The row carries the anchor its links land on.
 */
export default function AchievementTableRow<T>({
  view,
  columns,
  tags,
  pinInTitle = false,
  unoptimized,
}: {
  view: AchievementView<T>
  columns: AchievementColumn<T>[]
  tags?: (e: TableEntry<T>) => ReactNode
  /** RA's star sits beside the name, not in a column of its own. */
  pinInTitle?: boolean
  unoptimized: boolean
}) {
  const { entry: e, eye } = view
  const pin = view.pinned !== undefined && (
    <PinAchievementButton pinned={view.pinned} title={view.title} onToggle={view.onTogglePin} size={pinInTitle ? 16 : 18} className="relative z-10 shrink-0" />
  )

  return (
    <tr
      id={e.row.anchor}
      data-anchor={e.row.anchor}
      className={`${ROW} group/row scroll-mt-24 ${view.highlighted ? '[&>td]:bg-accent/15' : view.pinned ? '[&>td]:bg-accent/[0.05]' : ''}`}
    >
      <td className={`${TD_FIRST} w-16`}>
        <div className="relative w-[3.25rem] h-[3.25rem]">
          {view.iconUrl ? (
            <FadeImage
              src={view.iconUrl}
              alt=""
              width={52}
              height={52}
              className={badgeClass(e.row.earned ? earnedRing(e.row) : null)}
              imgClassName={badgeImgClass(!e.row.earned)}
              unoptimized={unoptimized}
            />
          ) : (
            <span className={`${badgeClass(null)} bg-ink/10`} aria-hidden="true" />
          )}
          {eye && <RevealSecretButton {...eye} className="z-10 w-9 h-9 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100" />}
        </div>
      </td>

      <td className={TD}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[0.9375rem] font-bold">
            <button type="button" onClick={view.onOpen} className="text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-ring">
              {view.title}
            </button>
          </h3>
          {tags?.(e)}
          {pinInTitle && pin}
        </div>
        <p className="mt-0.5 text-[0.8125rem] leading-normal text-text-secondary">{view.text}</p>
        <UnlockLine row={e.row} />
      </td>

      {columns.map((c) => (
        <td key={c.key} className={`${TD} ${c.align === 'center' ? MID : NUM} ${c.width ?? ''}`}>
          {c.cell(e)}
        </td>
      ))}

      {!pinInTitle && pin && <td className={`${TD} ${MID} w-12`}>{pin}</td>}
    </tr>
  )
}
